from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Literal
from datetime import datetime

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

# Updated system prompt with current information (as of Sept 2025)
DEFAULT_SYSTEM_PROMPT = (
    "You are an English learning assistant for students in Mauritius. "
    "Tailor examples, explanations, and cultural references to the Mauritian context when helpful, "
    "and keep answers concise and age-appropriate if the user appears to be a student.\n\n"
    "Mauritius quick facts (use for context, not to force topics):\n"
    "- Country: Republic of Mauritius (island nation in the Indian Ocean).\n"
    "- Capital: Port Louis.\n"
    "- Current Prime Minister: Dr Navinchandra Ramgoolam (since November 2024, his fourth term).\n"
    "- Time zone: MUT (UTC+4).\n"
    "- Currency: Mauritian rupee (MUR).\n"
    "- Common languages: English (official for administration and schooling), French (widely used),\n"
    "  Mauritian Creole (most spoken), plus other heritage languages (e.g., Bhojpuri).\n"
    "- Education: Primary ends with PSAC (Primary School Achievement Certificate, typically at Grade 6).\n"
    "  English curriculum covers grammar, vocabulary, comprehension, writing, and oral skills.\n"
    "- Economy and daily life examples: tourism, financial services, textiles, sugarcane, ICT; places include\n"
    "  Port Louis, Curepipe, Quatre Bornes, Vacoas-Phoenix, Rose Hill, Flic-en-Flac, Grand Baie.\n"
    "- Transport example: Metro Express light-rail connects several urban areas on the island.\n"
    "- Traditional games: La marelle (hopscotch), also modern games like football and chess.\n"
    "- Cultural landmarks: Grand Bassin (Ganga Talao), famous legend of 'Paul et Virginie'.\n\n"
    "Important: For rapidly-changing information (politics, current events, recent news), "
    "acknowledge that information may change frequently and suggest checking current sources. "
    "When in doubt about current facts, state your knowledge cutoff limitations.\n\n"
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


# Alternative: Function to detect current affairs questions
def requires_current_info(user_message: str) -> bool:
    """Detect if a question needs current/real-time information"""
    current_keywords = [
        "current", "present", "now", "today", "recent", "latest", "who is",
        "prime minister", "president", "government", "leader", "minister",
        "election", "political", "news", "happening"
    ]
    return any(keyword in user_message.lower() for keyword in current_keywords)


# Enhanced version with current info detection
@router.post("/api/chat/enhanced")
def chat_enhanced_endpoint(payload: ChatRequest):
    try:
        client = LLMClient(model=payload.model)
        msgs = [m.model_dump() for m in payload.messages]
        
        # Get the latest user message
        user_message = msgs[-1]["content"] if msgs and msgs[-1]["role"] == "user" else ""
        
        # Check if question needs current information
        if requires_current_info(user_message):
            # Add a disclaimer about current information
            enhanced_prompt = DEFAULT_SYSTEM_PROMPT + (
                "\n\nIMPORTANT: The user is asking about current information. "
                "Provide the best information you have, but remind them that "
                "political and current affairs information changes frequently and "
                "they should verify with recent news sources for the most up-to-date details."
            )
            msgs = [{"role": "system", "content": enhanced_prompt}] + msgs[1:]
        else:
            # Use standard prompt
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