# server/retriever.py
from __future__ import annotations

import json
import random
from pathlib import Path
from typing import Any, Dict, List, Optional

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

# Paths relative to this file
DATA_DIR = Path(__file__).parent / "data"
PASSAGES_PATH = DATA_DIR / "passages.jsonl"
INDEX_PATH = DATA_DIR / "index.faiss"

# Lazy globals
_model: Optional[SentenceTransformer] = None
_index: Optional[faiss.Index] = None
_passages: Optional[List[Dict[str, Any]]] = None


def _load() -> None:
    """Load the SBERT model, FAISS index, and passages into memory (lazy)."""
    global _model, _index, _passages

    if _model is None:
        _model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

    if _index is None and INDEX_PATH.exists():
        _index = faiss.read_index(str(INDEX_PATH))

    if _passages is None:
        with PASSAGES_PATH.open("r", encoding="utf-8") as f:
            _passages = [json.loads(line) for line in f]


def _encode_texts(texts: List[str]) -> np.ndarray:
    """SBERT encode + L2-normalize."""
    assert _model is not None, "Embedding model not loaded"
    vecs = _model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
    faiss.normalize_L2(vecs)
    return vecs


def search(
    query: str,
    k: int = 6,
    unit: int | None = None,
    skills: list[str] | None = None,
    seed: int | None = None,
) -> List[Dict[str, Any]]:
    """
    Retrieve textbook passages for a query.
    - Filters by `unit` and `skills` (skills match the 'section' heuristic tag).
    - Ranks by cosine similarity (dot product after L2 norm).
    - Samples from a wider top-N (for variety) with an optional `seed`.
    Returns passage dicts with keys: id, text, meta.
    """
    _load()
    assert _passages is not None

    # 1) Pre-filter by unit/skill (section) if provided
    candidates = _passages
    if unit is not None:
        candidates = [r for r in candidates if r.get("meta", {}).get("unit") == unit]

    if skills:
        want = {s.lower() for s in skills}
        candidates = [
            r
            for r in candidates
            if (r.get("meta", {}).get("section") or "").lower() in want
        ]

    # If filtering removed everything, fall back to the full set
    if not candidates:
        candidates = _passages

    # 2) Encode candidate texts and the query
    texts = [r["text"] for r in candidates]
    cand_vecs = _encode_texts(texts)
    q_vec = _encode_texts([query]).squeeze(0)  # shape: (dim,)

    # 3) Rank by cosine similarity (dot product after normalization)
    sims = cand_vecs @ q_vec  # (num_candidates,)
    order = np.argsort(-sims)  # descending

    # 4) Sample from a wider top-N for diversity
    topN = min(20, len(order))  # tune N as you like
    pool = [candidates[i] for i in order[:topN]]

    if seed is not None:
        random.seed(seed)
    random.shuffle(pool)

    # 5) Return top-k sampled passages
    return pool[:k]
