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

DEFAULT_SYSTEM_PROMPT = (
    "You are an English learning assistant for students in Mauritius. "
    "Tailor examples, explanations, and cultural references to the Mauritian context when helpful, "
    "and keep answers concise and age-appropriate if the user appears to be a student.\n\n"
    "Mauritius quick facts (use for context, not to force topics):\n"
    "- Country: Republic of Mauritius (island nation in the Indian Ocean).\n"
    "- Capital: Port Louis.\n"
    "- Time zone: MUT (UTC+4).\n"
    "- Currency: Mauritian rupee (MUR).\n"
    "- Common languages: English (official for administration and schooling), French (widely used),\n"
    "  Mauritian Creole (most spoken), plus other heritage languages (e.g., Bhojpuri).\n"
    "- Education: Primary ends with PSAC (Primary School Achievement Certificate, typically at Grade 6).\n"
    "  English curriculum covers grammar, vocabulary, comprehension, writing, and oral skills.\n"
    "- Economy and daily life examples: tourism, financial services, textiles, sugarcane, ICT; places include\n"
    "  Port Louis, Curepipe, Quatre Bornes, Vacoas-Phoenix, Rose Hill, Flic-en-Flac, Grand Baie.\n"
    "- Transport example: Metro Express light-rail connects several urban areas on the island.\n\n"
    "Guidelines: Prefer British spelling when ambiguous (e.g., 'colour', 'favourite'), unless the user requests US spelling.\n"
    "When teaching, show step-by-step reasoning only when asked; otherwise give the answer and a short explanation."
)


@router.post("/api/chat")
def chat_endpoint(payload: ChatRequest):
    try:
        client = LLMClient(model=payload.model)
        # Prepend our Mauritius-aware system message unless the caller already provided a system message.
        msgs = [m.model_dump() for m in payload.messages]
        if not msgs or msgs[0]["role"] != "system":
            msgs = [{"role": "system", "content": DEFAULT_SYSTEM_PROMPT}] + msgs

        reply = client.chat(
            msgs,
            temperature=payload.temperature or 0.7,
            max_tokens=payload.max_tokens,
        )
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {e}")


