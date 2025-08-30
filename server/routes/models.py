from fastapi import APIRouter, HTTPException
from openai import OpenAI, AuthenticationError
import os

router = APIRouter(prefix="/api/models", tags=["models"])

@router.get("/available")
def available():
    api_key = os.getenv("OPENAI_API_KEY")
    configured = os.getenv("MODEL_NAME", "gpt-4o-mini")
    if not api_key:
        raise HTTPException(status_code=400, detail="OPENAI_API_KEY is not set")

    try:
        client = OpenAI(api_key=api_key)
        data = client.models.list()
        names = [m.id for m in data.data]
        return {
            "configured_model": configured,
            "is_configured_available": configured in names,
            "models_sample": sorted([n for n in names if any(t in n for t in ["4o","4.1","mini","gpt"] )])[:50],
            "total_models_visible": len(names),
            "sdk": "v1+",
        }
    except AuthenticationError:
        raise HTTPException(status_code=401, detail="Invalid OPENAI_API_KEY.")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to list models: {type(e).__name__}")
