from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Literal

from ..llm import LLMClient

router = APIRouter()


class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: str | None = None
    temperature: float | None = 0.7
    max_tokens: int | None = 256


@router.post("/api/chat")
def chat_endpoint(payload: ChatRequest):
    try:
        client = LLMClient(model=payload.model)
        reply = client.chat(
            [m.model_dump() for m in payload.messages],
            temperature=payload.temperature or 0.7,
            max_tokens=payload.max_tokens,
        )
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {e}")


