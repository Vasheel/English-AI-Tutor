"""
LLM utilities. This module provides a thin wrapper around OpenAI-compatible APIs.
You can swap providers by changing the base URL and API key env vars.
"""

from __future__ import annotations

import os
from typing import Iterable, List
import requests


class LLMClient:
    def __init__(self, model: str | None = None, base_url: str | None = None, api_key: str | None = None):
        self.model = model or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.base_url = base_url or os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        self.api_key = api_key or os.getenv("OPENAI_API_KEY", "")

    def _headers(self):
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def chat(self, messages: List[dict], temperature: float = 0.4, max_tokens: int | None = None) -> str:
        url = f"{self.base_url}/chat/completions"
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
        }
        if max_tokens is not None:
            payload["max_tokens"] = max_tokens
        resp = requests.post(url, json=payload, headers=self._headers(), timeout=60)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()


def make_quiz_items_from_text(text: str, skills: Iterable[str], count: int = 3) -> List[dict]:
    """Very lightweight prompt that asks the model to make MCQ or FITB items.
    Real apps should add function calling/schema validation.
    """
    client = LLMClient()
    skill_str = ", ".join(skills)
    prompt = f"""
You are a quiz generator for English (grammar, vocabulary, comprehension).
Given the following source text, create up to {count} items as JSON with this shape:
{{"items": [{{"id": "...", "type": "mcq|fitb", "question": "...", "options": ["A","B","C","D"], "answer": "A" or 0 or ["..."], "explanation": "..."}}]}}
Only output JSON.

Skills: {skill_str}
Text:
"""
    messages = [
        {"role": "system", "content": "Return only strict JSON with an 'items' array."},
        {"role": "user", "content": prompt + text},
    ]
    raw = client.chat(messages)
    return [raw]


