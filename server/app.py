from __future__ import annotations

import json
import os
import uuid
from typing import Any, Dict, List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI

from dotenv import load_dotenv
# Always load env from the server directory to be robust when run from repo root
ENV_PATH = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=ENV_PATH)

try:
	from .quiz_schema import (
		AttemptPayload,
		BackendQuizResponse,
		QuizItem,
		GenerateQuizPayload,
		NextDifficultyRequest,
		NextDifficultyResponse,
		SaveQuizRequest,
		SaveQuizResponse,
	)
except Exception:
	from quiz_schema import (
		AttemptPayload,
		BackendQuizResponse,
		QuizItem,
		GenerateQuizPayload,
		NextDifficultyRequest,
		NextDifficultyResponse,
		SaveQuizRequest,
		SaveQuizResponse,
	)

# Import retriever
try:
	from .retriever import search as rag_search
except ImportError:
	from retriever import search as rag_search

def _create_llm_client() -> Optional[Any]:
	"""Create an LLM client if available and configured, otherwise return None."""
	if not os.getenv("OPENAI_API_KEY"):
		return None
	try:
		from .llm import LLMClient  # type: ignore
	except Exception:
		try:
			from llm import LLMClient  # type: ignore
		except Exception:
			return None
	return LLMClient()


app = FastAPI(title="English AI Tutor Backend", version="0.1.0")

# Allow Vite dev server and others during development
app.add_middleware(
	CORSMiddleware,
	allow_origins=["http://localhost:5173","http://127.0.0.1:5173","http://localhost:3000","http://127.0.0.1:3000","http://localhost:8080","http://127.0.0.1:8080"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


@app.get("/health")
def health() -> Dict[str, str]:
	return {"status": "ok"}


def _fallback_items(payload: GenerateQuizPayload) -> BackendQuizResponse:
	count = payload.count or 3
	quiz_items: List[QuizItem] = []

	# Simple deterministic examples to keep UI working without external APIs
	if count >= 1:
		quiz_items.append(
			QuizItem(
				id=str(uuid.uuid4()),
				type="mcq",
				question="Choose the correct form: She ____ to school every day.",
				options=["go", "goes", "going", "gone"],
				answer=1,
				explanation="Third person singular takes 'goes'.",
			)
		)
	if count >= 2:
		quiz_items.append(
			QuizItem(
				id=str(uuid.uuid4()),
				type="fitb",
				question="Fill in the blank: I have ___ apple.",
				answer="an",
				explanation="Use 'an' before a vowel sound.",
			)
		)
	if count >= 3:
		quiz_items.append(
			QuizItem(
				id=str(uuid.uuid4()),
				type="mcq",
				question="Select the synonym of 'quick'.",
				options=["slow", "rapid", "late", "weak"],
				answer=1,
				explanation="'Rapid' is a synonym of 'quick'.",
			)
		)

	import random
	random.shuffle(quiz_items)
	return BackendQuizResponse(items=quiz_items[:count], source="fallback")


@app.post("/api/quizzes/generate", response_model=BackendQuizResponse)
def generate_quiz(payload: GenerateQuizPayload) -> BackendQuizResponse:
	# Use OpenAI official client when configured; otherwise fallback
	api_key = os.getenv("OPENAI_API_KEY")
	if not api_key:
		print("[LLM] No OpenAI API key found → using fallback items")
		return _fallback_items(payload)
	oai_client = OpenAI(api_key=api_key)
	model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
	print("[LLM] OpenAI client created successfully")

	# --- NEW: retrieve passages from the textbook via FAISS ---
	# Make sure you ran:  python server/build_index.py
	skills = payload.skills or ["grammar"]
	query_text = payload.query or "PSAC Grade 6 English"
	try:
		passages = rag_search(query=query_text, k=6, unit=payload.unit, skills=skills)
		print(f"[RAG] retrieved {len(passages)} passages for skills={skills} query={query_text!r}")
	except Exception as e:
		print(f"[RAG] retrieval failed: {e}")
		passages = []

	# If retrieval failed or is empty, still proceed but warn the model
	context_blocks = []
	for p in passages:
		# p['text'] exists; keep it short per block
		context_blocks.append(f"[{p['id']}] {p['text'][:900]}")

	try:
		# Build a strict prompt using only textbook context when available
		messages = [
			{
				"role": "system",
				"content": (
					"You are a PSAC Grade 6 English quiz generator. "
					"Return STRICT JSON with an 'items' array. "
					"Use ONLY the provided textbook excerpts; "
					"if insufficient, keep items simple and aligned with basic English outcomes."
				),
			},
			{
				"role": "user",
				"content": (
					f"Make up to {payload.count or 3} items.\n"
					f"Skills: {', '.join(skills)}\n"
					f"Unit: {payload.unit}\n"
					f"Keywords: {', '.join(payload.keywords or [])}\n\n"
					+ ("TEXTBOOK EXCERPTS:\n" + "\n\n".join(context_blocks) if context_blocks else "No excerpts available.")
					+ "\n\nOutput JSON like:\n"
					+ '{ "items": [ { "id": "q1", "type": "mcq" | "fitb", "question": "...", "options": ["A","B","C","D"], "answer": 1 | "word", "explanation": "short" } ] }'
				),
			},
		]

		chat = oai_client.chat.completions.create(
			model=model,
			messages=messages,
			temperature=0.7,
		)
		content = (chat.choices[0].message.content or "").strip()

		# Accept either an object {items:[...]} or a raw array [...]
		if content.startswith("{"):
			data = json.loads(content)
		elif content.startswith("["):
			data = {"items": json.loads(content)}
		else:
			# If the model wrapped JSON in text, try to find the first JSON object/array
			try:
				start_brace = content.find("{")
				start_bracket = content.find("[")
				starts = [p for p in [start_brace, start_bracket] if p != -1]
				start = min(starts) if starts else -1
				if start == -1:
					return _fallback_items(payload)
				data = json.loads(content[start:])
				if isinstance(data, list):
					data = {"items": data}
			except Exception:
				return _fallback_items(payload)

		raw_items = data.get("items", []) if isinstance(data, dict) else []
		parsed_items: List[QuizItem] = []
		for entry in raw_items:
			try:
				parsed_items.append(QuizItem(**entry))
			except Exception:
				continue

		if not parsed_items:
			return _fallback_items(payload)
		source = "rag" if len(passages) > 0 else "fallback"
		return BackendQuizResponse(items=parsed_items[: (payload.count or 3)], source=source)

	except Exception:
		# Fall back silently so the UI remains usable during setup
		return _fallback_items(payload)


@app.post("/api/quizzes/save", response_model=SaveQuizResponse)
def save_quiz(req: SaveQuizRequest) -> SaveQuizResponse:
	# In a real app you'd persist to a DB. Here we just return a UUID.
	return SaveQuizResponse(id=str(uuid.uuid4()))


@app.post("/api/attempts")
def log_attempt(payload: AttemptPayload) -> Dict[str, str]:
	# Replace with persistence/analytics as needed
	return {"status": "ok"}


@app.post("/api/next-difficulty", response_model=NextDifficultyResponse)
def next_difficulty(req: NextDifficultyRequest) -> NextDifficultyResponse:
	# Trivial example: echo back same skill; plug in your adaptive logic if desired
	return NextDifficultyResponse(skill=req.skill)


if __name__ == "__main__":
	import uvicorn

	uvicorn.run("server.app:app", host="127.0.0.1", port=8000, reload=True)


