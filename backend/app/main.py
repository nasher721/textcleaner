import json
import threading
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .database import db, init_db, new_id, now_iso, row_to_dict, seed_data_if_empty
from .inference import infer_text
from .nlp import detect_negated, detect_temporal, segment_text
from .schemas import FeedbackRequest, InferRequest, NoteCreate, SentenceLabelIn, SpanCreate, TrainRequest
from .training import train_all

app = FastAPI(title="MedNoteCleaner API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

train_state: dict[str, Any] = {"status": "idle", "progress": 0, "last": None}


@app.on_event("startup")
def startup() -> None:
    init_db()
    seed_data_if_empty()


@app.post("/api/notes")
def create_note(payload: NoteCreate):
    note_id = new_id()
    with db() as conn:
        conn.execute(
            "INSERT INTO notes (id, created_at, source, raw_text, meta_json) VALUES (?, ?, ?, ?, ?)",
            (note_id, now_iso(), payload.source, payload.raw_text, json.dumps(payload.meta or {})),
        )
    return {"note_id": note_id}


@app.get("/api/notes/{note_id}")
def get_note(note_id: str):
    with db() as conn:
        note = conn.execute("SELECT * FROM notes WHERE id=?", (note_id,)).fetchone()
    if not note:
        raise HTTPException(404, "Note not found")
    return row_to_dict(note)


@app.get("/api/notes")
def list_notes(limit: int = 20, offset: int = 0):
    with db() as conn:
        rows = conn.execute("SELECT * FROM notes ORDER BY created_at DESC LIMIT ? OFFSET ?", (limit, offset)).fetchall()
    return [row_to_dict(r) for r in rows]


@app.post("/api/notes/{note_id}/segment")
def segment_note(note_id: str):
    with db() as conn:
        note = conn.execute("SELECT * FROM notes WHERE id=?", (note_id,)).fetchone()
        if not note:
            raise HTTPException(404, "Note not found")
        conn.execute("DELETE FROM sentences WHERE note_id=?", (note_id,))
        segments = segment_text(note["raw_text"])
        out = []
        for s in segments:
            sid = new_id()
            conn.execute(
                "INSERT INTO sentences (id, note_id, idx, text, start_char, end_char) VALUES (?, ?, ?, ?, ?, ?)",
                (sid, note_id, s["idx"], s["text"], s["start_char"], s["end_char"]),
            )
            out.append({"id": sid, **s})
    return out


@app.post("/api/sentences/{sentence_id}/label")
def label_sentence(sentence_id: str, payload: SentenceLabelIn):
    lid = new_id()
    with db() as conn:
        exists = conn.execute("SELECT id FROM sentences WHERE id=?", (sentence_id,)).fetchone()
        if not exists:
            raise HTTPException(404, "Sentence not found")
        conn.execute(
            "INSERT INTO sentence_labels (id, sentence_id, label, created_at, created_by) VALUES (?, ?, ?, ?, ?)",
            (lid, sentence_id, payload.label, now_iso(), "user"),
        )
    return {"id": lid, "sentence_id": sentence_id, "label": payload.label}


@app.post("/api/notes/{note_id}/spans")
def create_span(note_id: str, payload: SpanCreate):
    with db() as conn:
        note = conn.execute("SELECT raw_text FROM notes WHERE id=?", (note_id,)).fetchone()
        if not note:
            raise HTTPException(404, "Note not found")
        if payload.end_char > len(note["raw_text"]) or payload.start_char >= payload.end_char:
            raise HTTPException(400, "Invalid span offsets")
        txt = note["raw_text"][payload.start_char:payload.end_char]
        sid = new_id()
        conn.execute(
            "INSERT INTO span_annotations (id, note_id, label, start_char, end_char, text, negated, temporal, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (sid, note_id, payload.label, payload.start_char, payload.end_char, txt, detect_negated(txt), detect_temporal(txt), now_iso()),
        )
    return {"id": sid, "note_id": note_id, "text": txt, **payload.model_dump()}


@app.delete("/api/spans/{span_id}")
def delete_span(span_id: str):
    with db() as conn:
        conn.execute("DELETE FROM span_annotations WHERE id=?", (span_id,))
    return {"ok": True}


def _run_training(req: TrainRequest):
    train_state.update({"status": "running", "progress": 10})
    out = train_all(max_steps=req.max_steps, lr=req.lr, base_model=req.base_model)
    train_state.update({"status": "done", "progress": 100, "last": out})


@app.post("/api/train")
def train(req: TrainRequest):
    thread = threading.Thread(target=_run_training, args=(req,), daemon=True)
    thread.start()
    return {"status": "started"}


@app.get("/api/train/progress")
def train_progress():
    return train_state


@app.get("/api/models")
def list_models():
    with db() as conn:
        rows = conn.execute("SELECT * FROM model_versions ORDER BY created_at DESC").fetchall()
    return [row_to_dict(r) for r in rows]


@app.get("/api/models/{model_version_id}")
def get_model(model_version_id: str):
    with db() as conn:
        row = conn.execute("SELECT * FROM model_versions WHERE id=?", (model_version_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Model not found")
    return row_to_dict(row)


@app.post("/api/infer")
def infer(req: InferRequest):
    return infer_text(req.text, req.model_version_id)


@app.post("/api/feedback")
def feedback(req: FeedbackRequest):
    note_id = new_id()
    with db() as conn:
        conn.execute(
            "INSERT INTO notes (id, created_at, source, raw_text, meta_json) VALUES (?, ?, ?, ?, ?)",
            (note_id, now_iso(), "feedback", req.input_text, json.dumps({})),
        )
        sents = segment_text(req.input_text)
        sentence_map = {}
        for s in sents:
            sid = new_id()
            sentence_map[s["text"]] = sid
            conn.execute(
                "INSERT INTO sentences (id, note_id, idx, text, start_char, end_char) VALUES (?, ?, ?, ?, ?, ?)",
                (sid, note_id, s["idx"], s["text"], s["start_char"], s["end_char"]),
            )
        for sl in req.corrections.get("sentence_labels", []):
            if sl["sentence_text"] in sentence_map:
                conn.execute(
                    "INSERT INTO sentence_labels (id, sentence_id, label, created_at, created_by) VALUES (?, ?, ?, ?, ?)",
                    (new_id(), sentence_map[sl["sentence_text"]], sl["label"], now_iso(), "feedback"),
                )
        for sp in req.corrections.get("spans", []):
            txt = req.input_text[sp["start_char"]:sp["end_char"]]
            conn.execute(
                "INSERT INTO span_annotations (id, note_id, label, start_char, end_char, text, negated, temporal, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (new_id(), note_id, sp["label"], sp["start_char"], sp["end_char"], txt, detect_negated(txt), detect_temporal(txt), now_iso()),
            )
    return {"note_id": note_id, "status": "saved"}
