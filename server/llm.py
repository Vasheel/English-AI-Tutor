# server/llm.py
"""
LLM utilities. Thin wrapper around OpenAI-compatible APIs.
Env:
  OPENAI_API_KEY   (required)
  MODEL_NAME       (default: gpt-4o-mini)
  OPENAI_BASE_URL  (default: https://api.openai.com/v1)
"""

from __future__ import annotations

import json
import os
import time
from typing import Iterable, List, Literal, Optional, TypedDict

import requests
from dotenv import load_dotenv

load_dotenv()

# Load server/.env first
_SERVER_ENV = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=_SERVER_ENV)

# Then try project-root/.env (in case you want to share vars)
_ROOT_ENV = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(dotenv_path=_ROOT_ENV)

# Debug once
print("[ENV] server .env exists?", os.path.exists(_SERVER_ENV), "root .env exists?", os.path.exists(_ROOT_ENV))
print("[ENV] OPENAI_API_KEY length:", len(os.getenv("OPENAI_API_KEY") or "0"))

ChatRole = Literal["system", "user", "assistant"]


class ChatMessage(TypedDict):
    role: ChatRole
    content: str


class LLMClient:
    def __init__(
        self,
        model: Optional[str] = None,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout_s: float = 30.0,
        max_retries: int = 2,
    ):
        self.model: str = model or os.getenv("MODEL_NAME", "gpt-5")
        self.base_url: str = base_url or os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        self.api_key: str = api_key or os.getenv("OPENAI_API_KEY", "")
        self.timeout_s: float = timeout_s
        self.max_retries: int = max_retries

        if not self.api_key:
            raise RuntimeError("OPENAI_API_KEY is not set in server/.env")

        # One session = connection reuse
        self._session = requests.Session()
        self._session.headers.update({
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "psac-english-ai-tutor/1.0",
        })

        # Helpful one-time log
        print(f"[LLM] Using model={self.model} base_url={self.base_url}")

    def chat(
        self,
        messages: List[ChatMessage],
        *,
        temperature: float = 0.4,
        max_tokens: Optional[int] = None,
    ) -> str:
        url = f"{self.base_url.rstrip('/')}/chat/completions"
        # Prepare model fallback chain. You can override with FALLBACK_MODELS env (comma-separated)
        fallback_env = os.getenv("FALLBACK_MODELS", "gpt-4o-mini,gpt-4o,gpt-3.5-turbo")
        fallback_models = [m.strip() for m in fallback_env.split(",") if m.strip()]
        models_to_try: List[str] = [self.model] + [m for m in fallback_models if m != self.model]

        payload_base: dict = {
            "messages": messages,
            "temperature": temperature,
        }
        if max_tokens is not None:
            payload_base["max_tokens"] = max_tokens

        last_err: Optional[Exception] = None
        for model_name in models_to_try:
            payload = {**payload_base, "model": model_name}
            for attempt in range(self.max_retries + 1):
                try:
                    resp = self._session.post(url, json=payload, timeout=self.timeout_s)
                    if resp.status_code in (429, 500, 502, 503, 504):
                        raise RuntimeError(f"LLM HTTP {resp.status_code}: {resp.text[:200]}")
                    resp.raise_for_status()
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"]
                    if model_name != self.model:
                        print(f"[LLM] Fallback model in use: {model_name}")
                    return content.strip()
                except Exception as e:
                    last_err = e
                    # If it's a 400/Bad Request (often wrong/unknown model), try next model immediately
                    err_text = str(e)
                    if "400" in err_text or "Bad Request" in err_text:
                        break  # try next model_name
                    # small backoff then retry same model
                    if attempt < self.max_retries:
                        time.sleep(0.7 * (attempt + 1))
                    else:
                        break
        raise RuntimeError(f"LLM chat failed after retries: {last_err}")

# Optional helper if you want a one-shot quiz generator from plain text
def make_quiz_items_from_text(text: str, skills: Iterable[str], count: int = 3) -> List[dict]:
    """Generate quiz items as structured JSON. Returns a list of item dicts."""
    client = LLMClient()
    skill_str = ", ".join(skills)
    prompt = (
        "You are a quiz generator for PSAC Grade 6 English (grammar, vocabulary, comprehension). "
        f"Create up to {count} items as STRICT JSON with this shape:\n"
        '{"items":[{"id":"q1","type":"mcq|fitb","question":"...","options":["A","B","C","D"],'
        '"answer":0|"A"|"word","explanation":"short reason"}]} '
        "Output JSON only.\n\n"
        f"Skills: {skill_str}\n"
        "Source text:\n"
        f"{text[:3000]}\n"
    )
    messages: List[ChatMessage] = [
        {"role": "system", "content": "Return only strict JSON with an 'items' array."},
        {"role": "user", "content": prompt},
    ]
    raw = client.chat(messages)
    try:
        data = json.loads(raw)
        items = data.get("items", [])
        if not isinstance(items, list):
            raise ValueError("No 'items' array in model output")
        return items
    except Exception as e:
        # Propagate a clear error so caller can decide to fallback
        raise RuntimeError(f"Quiz JSON parse error: {e}\nRaw: {raw[:200]}...")
