from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class NoteCreate(BaseModel):
    text: str

class InferRequest(BaseModel):
    text: str
    model_version_id: Optional[str] = None
    keep_threshold: float = 0.5

class FeedbackRequest(BaseModel):
    note_id: str
    sentence_id: str
    label: str

class TrainRequest(BaseModel):
    base_model: str = "en_core_web_sm"
    max_steps: int = 200
    lr: float = 0.001
    dropout: float = 0.2
    batch_size: int = 32

class SpanCreate(BaseModel):
    note_id: str
    start: int
    end: int
    label: str
    text: str

class SentenceLabelIn(BaseModel):
    sentence_id: str
    label: str

class BatchInferRequest(BaseModel):
    texts: List[str]
    model_version_id: Optional[str] = None
    keep_threshold: float = 0.5

class LabelRequest(BaseModel):
    label: str
