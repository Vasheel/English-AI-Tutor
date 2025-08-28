from __future__ import annotations

import json
import os
import re
import uuid
from typing import Any, Dict, List, Optional, Tuple

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI

from dotenv import load_dotenv
# Always load env from the server directory to be robust when run from repo root
ENV_PATH = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=ENV_PATH)

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
from .retriever import search as rag_search

# Helper functions for normalizing quiz items
LETTER_TO_INDEX = {"a": 0, "b": 1, "c": 2, "d": 3}

def _strip_letter_prefix(s: str) -> str:
	# removes "A:", "B)", "c -", etc.
	return re.sub(r"^\s*[A-Da-d]\s*[:\-\)\.]\s*", "", s).strip()

def _normalize_items(raw_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
	cleaned: List[Dict[str, Any]] = []
	for it in raw_items:
		t = (it.get("type") or "").lower()
		q = (it.get("question") or "").strip()
		exp = (it.get("explanation") or "").strip()

		if t == "mcq":
			options = it.get("options") or []
			options = [o for o in options if isinstance(o, str)]
			options = [_strip_letter_prefix(o) for o in options]
			# normalize answer -> index
			ans = it.get("answer")
			idx: int | None = None
			if isinstance(ans, int):
				idx = ans if 0 <= ans < len(options) else None
			elif isinstance(ans, str):
				a = ans.strip().lower()
				if a in LETTER_TO_INDEX:
					idx = LETTER_TO_INDEX[a]
				else:
					# try matching by text
					try:
						idx = next(i for i, o in enumerate(options) if o.lower() == ans.strip().lower())
					except StopIteration:
						idx = None
			if not q or len(options) < 2 or idx is None:
				continue  # drop malformed
			cleaned.append({
				"id": it.get("id") or f"q{len(cleaned)+1}",
				"type": "mcq",
				"question": q,
				"options": options,
				"answer": idx,                 # IMPORTANT: integer index
				"explanation": exp or "Check the textbook passage.",
			})

		elif t == "fitb":
			ans = it.get("answer")
			if not q or not isinstance(ans, str):
				continue
			bad = ans.strip().lower() in {"string", "placeholder", "lorem"}
			if bad:
				continue
			cleaned.append({
				"id": it.get("id") or f"q{len(cleaned)+1}",
				"type": "fitb",
				"question": q,
				"answer": ans.strip(),
				"explanation": exp or "Use the word that best completes the sentence.",
			})

		else:
			# drop other types for now
			continue

	# Optional: limit and shuffle
	# import random; random.shuffle(cleaned)
	return cleaned

def _create_llm_client() -> Optional[Any]:
	"""Create an LLM client if available and configured, otherwise return None."""
	if not os.getenv("OPENAI_API_KEY"):
		return None
	try:
		from .llm import LLMClient  # type: ignore
		return LLMClient()
	except Exception:
		return None


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
		passages = rag_search(query=query_text, k=6, unit=payload.unit, skills=skills, seed=payload.seed)
		print(f"[RAG] retrieved {len(passages)} passages for skills={skills} query={query_text!r} seed={payload.seed}")
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
		SYSTEM_RULES = (
			"Return STRICT JSON with an 'items' array.\n"
			"Item rules:\n"
			"- type: 'mcq' or 'fitb' only.\n"
			"- For mcq: 'options' must be an array of plain strings (NO 'A:'/'B:' prefixes). "
			"The 'answer' must be an INTEGER index (0-based) of the correct option.\n"
			"- For fitb: omit 'options'. 'answer' must be the exact missing word/phrase (string), no placeholders.\n"
			"- No placeholder values like 'string', 'lorem', etc.\n"
            "Prefer asking about different subskills and word choices than in recent generations; avoid repeating very common items like 'opposite of happy'.\n"
		)
		messages = [
				{
					"role": "system",
					"content": (
						"You are a PSAC Grade 6 English quiz generator. "
						+ SYSTEM_RULES
						+ "Use ONLY the provided textbook excerpts; "
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
		
		# Normalize and clean the items
		normalized_items = _normalize_items(raw_items)
		
		if not normalized_items:
			return _fallback_items(payload)
		
		# Shuffle items before returning
		import random
		random.shuffle(normalized_items)
		
		source = "rag" if passages else "llm"
		return BackendQuizResponse(
			items=normalized_items[: (payload.count or 3)],
			source=source
		)

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


