import json
import pickle
from pathlib import Path

import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_recall_fscore_support
from sklearn.model_selection import train_test_split
from spacy.training import Example

from .database import db, new_id, now_iso, row_to_dict
from .nlp import group_spans_by_note

MODEL_DIR = Path(__file__).resolve().parents[1] / "models"
MODEL_DIR.mkdir(exist_ok=True)


def train_all(max_steps: int = 200, lr: float = 0.001, base_model: str = "en") -> dict:
    with db() as conn:
        sent_rows = [row_to_dict(r) for r in conn.execute(
            "SELECT s.text, sl.label FROM sentence_labels sl JOIN sentences s ON s.id=sl.sentence_id"
        ).fetchall()]
        note_rows = [row_to_dict(r) for r in conn.execute("SELECT id, raw_text FROM notes").fetchall()]
        span_rows = [row_to_dict(r) for r in conn.execute("SELECT note_id,start_char,end_char,label FROM span_annotations").fetchall()]

    texts = [r["text"] for r in sent_rows]
    y = [1 if r["label"] == "KEEP" else 0 for r in sent_rows]
    if len(texts) < 4:
        raise ValueError("Not enough sentence labels to train")
    X_train, X_val, y_train, y_val = train_test_split(texts, y, test_size=0.2, random_state=42, stratify=y)
    vec = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
    Xtr = vec.fit_transform(X_train)
    Xv = vec.transform(X_val)
    clf = LogisticRegression(max_iter=max_steps)
    clf.fit(Xtr, y_train)
    pred = clf.predict(Xv)

    acc = accuracy_score(y_val, pred)
    f1 = f1_score(y_val, pred)

    nlp = spacy.blank("en") if base_model == "en" else spacy.blank("en")
    ner = nlp.add_pipe("ner")
    grouped = group_spans_by_note(span_rows)
    train_examples = []
    for n in note_rows:
        ents = grouped.get(n["id"], [])
        if not ents:
            continue
        for _, _, lbl in ents:
            ner.add_label(lbl)
        train_examples.append((n["raw_text"], {"entities": ents}))

    examples = []
    for txt, ann in train_examples:
        doc = nlp.make_doc(txt)
        examples.append(Example.from_dict(doc, ann))
    if examples:
        optimizer = nlp.begin_training()
        for _ in range(min(max_steps, 30)):
            nlp.update(examples, sgd=optimizer, losses={})

    model_id = new_id()
    sent_path = MODEL_DIR / f"sentence_{model_id}.pkl"
    ner_path = MODEL_DIR / f"spacy_{model_id}"
    with open(sent_path, "wb") as f:
        pickle.dump({"vectorizer": vec, "classifier": clf}, f)
    nlp.to_disk(ner_path)

    ner_metrics = {"per_label": {}}
    if examples:
        gold = []
        pred_labels = []
        for txt, ann in train_examples:
            d = nlp(txt)
            gold.extend([e[2] for e in ann["entities"]])
            pred_labels.extend([e.label_ for e in d.ents])
        labels = sorted(list(set(gold) | set(pred_labels)))
        p, r, f, _ = precision_recall_fscore_support(gold, pred_labels[: len(gold)] if pred_labels else ["OTHER"] * len(gold), labels=labels, average=None, zero_division=0)
        ner_metrics["per_label"] = {labels[i]: {"precision": float(p[i]), "recall": float(r[i]), "f1": float(f[i])} for i in range(len(labels))}

    metrics = {
        "sentence": {"accuracy": float(acc), "f1": float(f1)},
        "ner": ner_metrics,
    }

    with db() as conn:
        conn.execute(
            "INSERT INTO model_versions (id, created_at, spacy_model_path, sentence_model_path, metrics_json, training_config_json) VALUES (?, ?, ?, ?, ?, ?)",
            (model_id, now_iso(), str(ner_path), str(sent_path), json.dumps(metrics), json.dumps({"max_steps": max_steps, "lr": lr, "base_model": base_model})),
        )
    return {"model_version_id": model_id, "metrics": metrics}
