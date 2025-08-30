# server/routes/debug.py
from fastapi import APIRouter
import os, hashlib, re

router = APIRouter(prefix="/api/debug", tags=["debug"])

def _mask(v: str|None) -> str|None:
    if not v: return None
    v = v.strip()
    return (v[:4] + "..." + v[-4:]) if len(v) >= 8 else "***"

def _fp(v: str|None) -> str|None:
    if not v: return None
    return hashlib.sha1(v.encode()).hexdigest()[:8]

def _clean_key(v: str|None) -> str|None:
    if not v: return None
    # remove whitespace everywhere and any non [A-Za-z0-9-_]
    v = re.sub(r"\s+", "", v)
    v = re.sub(r"[^A-Za-z0-9\-_]", "", v)
    return v

@router.get("/env")
def env_probe():
    raw = os.getenv("OPENAI_API_KEY")
    cleaned = _clean_key(raw)

    return {
        "OPENAI_API_KEY_present": bool(raw),
        "raw_masked": _mask(raw),
        "raw_len": len(raw) if raw is not None else 0,
        "raw_fp": _fp(raw),

        "cleaned_masked": _mask(cleaned),
        "cleaned_len": len(cleaned) if cleaned is not None else 0,
        "cleaned_fp": _fp(cleaned),

        "equal_after_clean": (raw == cleaned) if raw is not None else None,
        "MODEL_NAME": os.getenv("MODEL_NAME"),
    }
