# server/build_index.py
import os, json
from pathlib import Path
from sentence_transformers import SentenceTransformer
import faiss
from PyPDF2 import PdfReader

DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_DIR.mkdir(exist_ok=True)
PDF_PATH = DATA_DIR / "book.pdf"
PASSAGES_PATH = DATA_DIR / "passages.jsonl"
INDEX_PATH = DATA_DIR / "index.faiss"

# 1. Read PDF
reader = PdfReader(str(PDF_PATH))
texts = []
for i, page in enumerate(reader.pages):
    content = page.extract_text()
    if not content:
        continue
    for chunk in content.split("\n"):
        chunk = chunk.strip()
        if chunk:
            texts.append({"id": f"p{i}_{len(texts)}", "text": chunk, "meta": {"page": i+1}})

print(f"Extracted {len(texts)} passages from {PDF_PATH.name}")

# 2. Save passages.jsonl
with open(PASSAGES_PATH, "w", encoding="utf-8") as f:
    for rec in texts:
        f.write(json.dumps(rec, ensure_ascii=False) + "\n")

# 3. Build FAISS index
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
vecs = model.encode([t["text"] for t in texts], convert_to_numpy=True, show_progress_bar=True)
faiss.normalize_L2(vecs)
index = faiss.IndexFlatIP(vecs.shape[1])
index.add(vecs)
faiss.write_index(index, str(INDEX_PATH))

print(f"Saved {len(texts)} passages → {PASSAGES_PATH}")
print(f"FAISS index saved → {INDEX_PATH}")
