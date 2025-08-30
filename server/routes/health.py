# server/routes/health.py
from fastapi import APIRouter
from openai import OpenAI, AuthenticationError, APIConnectionError, APIStatusError
import os

router = APIRouter(prefix="/api", tags=["health"])

@router.get("/health")
def health():
    model = os.getenv("MODEL_NAME", "gpt-4o-mini")
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        return {"status": "degraded", "openai_reachable": False, "model": model, "error": "OPENAI_API_KEY missing"}

    try:
        # Lightweight check (free): just verify the model exists for this key
        client = OpenAI(api_key=api_key)
        client.models.retrieve(model)
        return {"status": "up", "openai_reachable": True, "model": model}

    except AuthenticationError:
        return {"status": "degraded", "openai_reachable": False, "model": model, "error": "Invalid OPENAI_API_KEY"}
    except APIConnectionError as e:
        return {"status": "degraded", "openai_reachable": False, "model": model, "error": f"Connection error: {e}"}
    except APIStatusError as e:
        # Covers 4xx/5xx from OpenAI; include status code for clarity
        return {"status": "degraded", "openai_reachable": False, "model": model, "error": f"OpenAI error {e.status_code}"}
    except Exception as e:
        return {"status": "degraded", "openai_reachable": False, "model": model, "error": str(e)}
