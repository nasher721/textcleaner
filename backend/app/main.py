import sqlite3
import uuid
import threading
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, BackgroundTasks, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware

from .inference import infer_text
from .schemas import BatchInferRequest, FeedbackRequest, InferRequest, NoteCreate, SentenceLabelIn, SpanCreate, TrainRequest, LabelRequest
from .training import train_all
from .db.repository import Repository

app = FastAPI(title="MedNoteCleaner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# DB Dependency
def get_repo():
    conn = sqlite3.connect("mednotecleaner.db", check_same_thread=False)
    try:
        yield Repository(conn)
    finally:
        conn.close()

@app.get("/api/dashboard/stats")
async def dashboard_stats(repo: Repository = Depends(get_repo)):
    return repo.get_stats()

@app.post("/api/infer/batch/export")
async def infer_batch_export(req: BatchInferRequest):
    results = [
        infer_text(text, req.model_version_id, req.keep_threshold)
        for text in req.texts
    ]
    return {
        "count": len(results),
        "results": results,
    }

@app.get("/api/notes/search")
async def search_notes(q: str, repo: Repository = Depends(get_repo)):
    return repo.search_notes(q)

@app.get("/api/notes/all")
async def get_all_notes(repo: Repository = Depends(get_repo)):
    return repo.all_notes()

@app.get("/api/notes/{note_id}")
async def get_note(note_id: str, repo: Repository = Depends(get_repo)):
    note = repo.get_note(note_id)
    if not note: raise HTTPException(status_code=404, detail="Note not found")
    return note

@app.get("/api/sentences")
async def get_sentences(repo: Repository = Depends(get_repo)):
    return repo.get_sentences_for_labeling()

@app.post("/api/sentences/{sentence_id}/label")
async def label_sentence(sentence_id: str, req: LabelRequest, repo: Repository = Depends(get_repo)):
    repo.submit_label(sentence_id, req.label)
    return {"status": "ok"}

@app.get("/api/models")
async def get_models(repo: Repository = Depends(get_repo)):
    return repo.get_models()

@app.post("/api/infer")
async def infer(req: InferRequest):
    return infer_text(req.text, req.model_version_id, req.keep_threshold)

@app.post("/api/train")
async def train(req: TrainRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(train_all, req)
    return {"status": "training initiated"}

@app.get("/api/train/progress")
async def train_progress():
    from .training import get_training_progress
    return get_training_progress()
