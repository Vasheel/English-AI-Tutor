"""
Pydantic schemas for quiz generation, saving, attempts, and difficulty.
These should align with the frontend types in src/lib/api.ts.
"""

from typing import List, Optional, Union
from pydantic import BaseModel, Field


class QuizItem(BaseModel):
    id: Optional[str] = None
    type: str = Field(description="'mcq' | 'fitb' | 'reorder' | 'match' | 'short'")
    question: Optional[str] = None
    options: Optional[List[str]] = None
    answer: Union[str, int, List[str]]
    explanation: Optional[str] = None


class BackendQuizResponse(BaseModel):
    items: Optional[List[QuizItem]] = None
    source: Optional[str] = None


class GenerateQuizPayload(BaseModel):
    # --- legacy fields (keep working with old frontend) ---
    topic: Optional[str] = None
    grade: str = "Grade 6"
    num_questions: Optional[int] = None

    # --- new flexible fields (what you started sending) ---
    count: Optional[int] = None
    skills: List[str] = Field(default_factory=lambda: ["grammar"])
    unit: Optional[str] = None
    keywords: List[str] = Field(default_factory=list)
    query: Optional[str] = None
    seed: Optional[int] = None


class SaveQuizRequest(BaseModel):
    quiz: dict


class SaveQuizResponse(BaseModel):
    id: str


class AttemptPayload(BaseModel):
    quiz_id: str
    item_id: str
    skill: str
    user_id: Optional[str] = None
    user_answer: str
    is_correct: bool
    time_ms: Optional[int] = None


class NextDifficultyRequest(BaseModel):
    user_id: str
    skill: str


class NextDifficultyResponse(BaseModel):
    skill: str


