import re
from collections import defaultdict
from typing import Any

import spacy
from spacy.language import Language

NEGATION_PATTERNS = [r"\bno\b", r"\bdenies\b", r"\bwithout\b", r"\bnegative for\b"]
TEMPORAL_PATTERNS = {
    "history": [r"\bhistory of\b", r"\bprior\b", r"\bpreviously\b"],
    "plan": [r"\bplan\b", r"\bwill\b", r"\bconsider\b"],
    "current": [r"\btoday\b", r"\bcurrently\b", r"\bnow\b"],
}


def get_segmenter() -> Language:
    nlp = spacy.blank("en")
    if "sentencizer" not in nlp.pipe_names:
        nlp.add_pipe("sentencizer")
    return nlp


def segment_text(text: str) -> list[dict[str, Any]]:
    nlp = get_segmenter()
    # ICU shorthand bullets normalization for segmentation only
    normalized = re.sub(r"\n[-*]\s*", ". ", text)
    doc = nlp(normalized)
    out = []
    cursor = 0
    for idx, sent in enumerate(doc.sents):
        st = text.find(sent.text.strip(), cursor)
        if st < 0:
            st = cursor
        en = st + len(sent.text.strip())
        cursor = en
        out.append({"idx": idx, "text": sent.text.strip(), "start_char": st, "end_char": en})
    return [s for s in out if s["text"]]


def detect_negated(text: str) -> bool:
    lowered = text.lower()
    return any(re.search(p, lowered) for p in NEGATION_PATTERNS)


def detect_temporal(text: str) -> str | None:
    lowered = text.lower()
    for k, patterns in TEMPORAL_PATTERNS.items():
        if any(re.search(p, lowered) for p in patterns):
            return k
    return None


def assemble_structured(entities: list[dict[str, Any]]) -> dict[str, Any]:
    out: dict[str, Any] = {
        "neuro_exam": "",
        "imaging": [],
        "vent": {"raw": []},
        "hemodynamics": {"pressors": [], "map": None, "raw": []},
        "labs": {"values": {}, "raw": []},
        "medications": [],
        "procedures": [],
        "assessment": "",
    }
    lab_re = re.compile(r"([A-Za-z]+)\s*[:=]\s*([0-9.]+)")
    map_re = re.compile(r"MAP\s*[:=]?\s*(\d+)", re.I)
    for e in entities:
        txt = e["text"]
        label = e["label"]
        if label == "NEURO_EXAM":
            out["neuro_exam"] += (" " + txt).strip()
        elif label == "IMAGING":
            out["imaging"].append(txt)
        elif label == "VENT":
            out["vent"]["raw"].append(txt)
        elif label == "HEMODYNAMICS":
            out["hemodynamics"]["raw"].append(txt)
            mm = map_re.search(txt)
            if mm:
                out["hemodynamics"]["map"] = int(mm.group(1))
            if "norepi" in txt.lower() or "vaso" in txt.lower():
                out["hemodynamics"]["pressors"].append(txt)
        elif label == "LAB":
            out["labs"]["raw"].append(txt)
            for m in lab_re.finditer(txt):
                out["labs"]["values"][m.group(1)] = m.group(2)
        elif label == "MEDICATION":
            out["medications"].append(txt)
        elif label == "PROCEDURE":
            out["procedures"].append(txt)
        elif label == "ASSESSMENT":
            out["assessment"] += (" " + txt).strip()
    return out


def group_spans_by_note(spans: list[dict[str, Any]]) -> dict[str, list[tuple[int, int, str]]]:
    grouped: dict[str, list[tuple[int, int, str]]] = defaultdict(list)
    for s in spans:
        grouped[s["note_id"]].append((s["start_char"], s["end_char"], s["label"]))
    return grouped
