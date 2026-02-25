import json
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Any, Iterable

DB_PATH = Path(__file__).resolve().parents[1] / "mednotecleaner.db"


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def db() -> Iterable[sqlite3.Connection]:
    conn = get_conn()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def now_iso() -> str:
    return datetime.utcnow().isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


def init_db() -> None:
    schema_path = Path(__file__).resolve().parents[1] / "migrations.sql"
    with db() as conn:
        conn.executescript(schema_path.read_text())


def seed_data_if_empty() -> None:
    seed = Path(__file__).resolve().parents[1] / "data" / "seed_data.json"
    payload = json.loads(seed.read_text())
    with db() as conn:
        existing = conn.execute("SELECT COUNT(*) as c FROM notes").fetchone()["c"]
        if existing > 0:
            return
        for note in payload["notes"]:
            conn.execute(
                "INSERT INTO notes (id, created_at, source, raw_text, meta_json) VALUES (?, ?, ?, ?, ?)",
                (note["id"], now_iso(), "seed", note["raw_text"], json.dumps(note.get("meta", {}))),
            )
        for s in payload["sentences"]:
            conn.execute(
                "INSERT INTO sentences (id, note_id, idx, text, start_char, end_char) VALUES (?, ?, ?, ?, ?, ?)",
                (s["id"], s["note_id"], s["idx"], s["text"], s["start_char"], s["end_char"]),
            )
        for sl in payload["sentence_labels"]:
            conn.execute(
                "INSERT INTO sentence_labels (id, sentence_id, label, created_at, created_by) VALUES (?, ?, ?, ?, ?)",
                (sl["id"], sl["sentence_id"], sl["label"], now_iso(), "seed"),
            )
        for sp in payload["span_annotations"]:
            conn.execute(
                "INSERT INTO span_annotations (id, note_id, label, start_char, end_char, text, negated, temporal, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (sp["id"], sp["note_id"], sp["label"], sp["start_char"], sp["end_char"], sp["text"], sp.get("negated"), sp.get("temporal"), now_iso()),
            )


def row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    return {k: row[k] for k in row.keys()}
