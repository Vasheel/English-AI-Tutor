from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Optional


def search(query: str, k: int = 6, unit: Optional[int] = None, skills: Optional[List[str]] = None) -> List[Dict[str, str]]:
	"""Return up to k passages as dicts with keys 'id' and 'text'.
	
	This is a lightweight stub:
	- If a PDF exists at server/data/book.pdf and PyPDF2 is available, it tries to extract some text blocks.
	- Otherwise, it returns synthetic placeholder passages so downstream logic keeps working.
	"""
	passages: List[Dict[str, str]] = []

	# Attempt to pull some text from an optional local PDF
	data_dir = Path(__file__).parent / "data"
	pdf_path = data_dir / "book.pdf"
	text_chunks: List[str] = []
	try:
		if pdf_path.exists():
			try:
				import PyPDF2  # type: ignore
				with open(pdf_path, "rb") as f:
					reader = PyPDF2.PdfReader(f)
					for page in reader.pages[: min(len(reader.pages), 10)]:
						page_text = page.extract_text() or ""
						for block in page_text.split("\n\n"):
							block = block.strip()
							if block:
								text_chunks.append(block)
			except Exception:
				# Swallow and fall back to synthetic
				text_chunks = []
	except Exception:
		text_chunks = []

	if text_chunks:
		for i, chunk in enumerate(text_chunks[:k]):
			passages.append({"id": f"pdf-{i+1}", "text": chunk[:1200]})
	else:
		# Synthetic placeholders so RAG path works even without an index
		topic = (query or "English").strip()
		skill_str = ", ".join(skills or []) or "general"
		for i in range(min(k, 6)):
			passages.append(
				{
					"id": f"synth-{i+1}",
					"text": f"Topic: {topic}. Skill focus: {skill_str}. Unit: {unit}. Placeholder excerpt to enable quiz generation.",
				}
			)

	return passages
