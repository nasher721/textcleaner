from typing import Any, Literal
from pydantic import BaseModel, Field

SentenceLabelType = Literal["KEEP", "REMOVE"]
SpanLabelType = Literal[
    "NEURO_EXAM", "IMAGING", "VENT", "HEMODYNAMICS", "LAB", "MEDICATION", "PROCEDURE", "ASSESSMENT", "OTHER"
]


class NoteCreate(BaseModel):
    raw_text: str
    source: str = "paste"
    meta: dict[str, Any] | None = None


class SentenceLabelIn(BaseModel):
    label: SentenceLabelType


class SpanCreate(BaseModel):
    start_char: int = Field(ge=0)
    end_char: int = Field(gt=0)
    label: SpanLabelType


class TrainRequest(BaseModel):
    base_model: str = "en"
    max_steps: int = 200
    lr: float = 0.001


class InferRequest(BaseModel):
    text: str
    model_version_id: str | None = None


class FeedbackRequest(BaseModel):
    input_text: str
    corrections: dict[str, Any]
