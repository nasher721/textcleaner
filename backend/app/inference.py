import json
import pickle
from pathlib import Path
from typing import Any

import spacy

from .database import db, new_id, now_iso, row_to_dict
from .nlp import assemble_structured, detect_negated, detect_temporal, segment_text



def _load_model(model_version_id: str | None):
    with db() as conn:
        if model_version_id:
            row = conn.execute("SELECT * FROM model_versions WHERE id=?", (model_version_id,)).fetchone()
        else:
            row = conn.execute("SELECT * FROM model_versions ORDER BY created_at DESC LIMIT 1").fetchone()
    if not row:
        return None, None, None
    rec = row_to_dict(row)
    with open(rec["sentence_model_path"], "rb") as f:
        sent_model = pickle.load(f)
    nlp = spacy.load(rec["spacy_model_path"])
    return rec["id"], sent_model, nlp


def infer_text(text: str, model_version_id: str | None = None, keep_threshold: float = 0.5) -> dict[str, Any]:
    model_id, sent_model, ner_nlp = _load_model(model_version_id)
    warnings = []
    sents = segment_text(text)
    sentence_keep_probs = []
    keep_texts = []

    if sent_model:
        X = sent_model["vectorizer"].transform([s["text"] for s in sents])
        probs = sent_model["classifier"].predict_proba(X)[:, 1]
    else:
        warnings.append("No trained model found. Using default KEEP for all sentences.")
        probs = [1.0] * len(sents)

    for s, p in zip(sents, probs):
        sentence_keep_probs.append({"sentence": s["text"], "prob_keep": float(p)})
        if p >= keep_threshold:
            keep_texts.append(text[s["start_char"]: s["end_char"]])

    entities = []
    if ner_nlp:
        doc = ner_nlp(text)
        for ent in doc.ents:
            e_txt = ent.text
            entities.append(
                {
                    "label": ent.label_,
                    "text": e_txt,
                    "start_char": ent.start_char,
                    "end_char": ent.end_char,
                    "prob": 0.7,
                    "negated": detect_negated(e_txt),
                    "temporal": detect_temporal(e_txt),
                }
            )
    else:
        warnings.append("No NER model found. Structured extraction may be empty.")

    structured_json = assemble_structured(entities)
    cleaned = "\n".join([t.strip() for t in keep_texts if t.strip()])
    confidence = {"sentence_keep_probs": sentence_keep_probs, "entities": entities}

    with db() as conn:
        run_id = new_id()
        conn.execute(
            "INSERT INTO inference_runs (id, created_at, model_version_id, input_text, cleaned_text, output_json, confidence_json) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (run_id, now_iso(), model_id, text, cleaned, json.dumps(structured_json), json.dumps(confidence)),
        )

    return {
        "cleaned_text": cleaned,
        "structured_json": structured_json,
        "confidence": confidence,
        "warnings": warnings,
        "meta": {
            "model_version_id": model_id,
            "keep_threshold": keep_threshold,
            "kept_sentence_count": len(keep_texts),
            "total_sentence_count": len(sents),
        },
    }
