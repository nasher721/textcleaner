import sqlite3
from typing import Dict, List, Any, Optional

DB_PATH = "mednotecleaner.db"

class Repository:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    def get_stats(self) -> Dict[str, Any]:
        counts = {
            "notes": self.conn.execute("SELECT COUNT(*) FROM notes").fetchone()[0],
            "models": self.conn.execute("SELECT COUNT(*) FROM model_versions").fetchone()[0],
            "total_sentences": self.conn.execute("SELECT COUNT(*) FROM sentences").fetchone()[0],
            "labeled_sentences": self.conn.execute("SELECT COUNT(DISTINCT sentence_id) FROM sentence_labels").fetchone()[0],
            "span_annotations": self.conn.execute("SELECT COUNT(*) FROM span_annotations").fetchone()[0],
        }
        history = self.conn.execute("""
            SELECT date(created_at) as day, COUNT(*) as count 
            FROM sentence_labels 
            WHERE created_at > date('now', '-7 days')
            GROUP BY day ORDER BY day ASC
        """).fetchall()
        counts["labeling_history"] = [{"day": r[0], "count": r[1]} for r in history]
        return counts

    def get_models(self) -> List[Dict[str, Any]]:
        rows = self.conn.execute("SELECT id, version, base_model, is_active, max_steps, lr, created_at FROM model_versions ORDER BY created_at DESC").fetchall()
        return [
            {"id": r[0], "version": r[1], "base_model": r[2], "is_active": bool(r[3]), "max_steps": r[4], "lr": r[5], "created_at": r[6]} 
            for r in rows
        ]

    def all_notes(self) -> List[Dict[str, Any]]:
        rows = self.conn.execute("SELECT id, raw_text, created_at FROM notes ORDER BY created_at DESC").fetchall()
        return [{"id": r[0], "text": r[1], "date": r[2]} for r in rows]

    def search_notes(self, query: str) -> List[Dict[str, Any]]:
        rows = self.conn.execute("""
            SELECT id, raw_text, created_at FROM notes 
            WHERE raw_text LIKE ? 
            ORDER BY created_at DESC LIMIT 50
        """, (f"%{query}%",)).fetchall()
        return [{"id": r[0], "text": r[1], "date": r[2]} for r in rows]

    def get_sentences_for_labeling(self, limit: int = 50) -> List[Dict[str, Any]]:
        rows = self.conn.execute("""
            SELECT s.id, s.text, sl.label 
            FROM sentences s
            LEFT JOIN sentence_labels sl ON s.id = sl.sentence_id
            LIMIT ?
        """, (limit,)).fetchall()
        return [{"id": r[0], "text": r[1], "last_label": r[2]} for r in rows]

    def submit_label(self, sentence_id: str, label: str):
        self.conn.execute("""
            INSERT INTO sentence_labels (sentence_id, label) VALUES (?, ?)
            ON CONFLICT(sentence_id) DO UPDATE SET label=excluded.label, created_at=CURRENT_TIMESTAMP
        """, (sentence_id, label))
        self.conn.commit()

    def get_note(self, note_id: str) -> Optional[Dict[str, Any]]:
        row = self.conn.execute("SELECT id, raw_text, created_at FROM notes WHERE id = ?", (note_id,)).fetchone()
        if not row: return None
        return {"id": row[0], "text": row[1], "date": row[2]}
