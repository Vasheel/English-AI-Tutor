# server/app.py
from pathlib import Path
from dotenv import load_dotenv
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load env from server/.env and override anything stale
load_dotenv(dotenv_path=Path(__file__).with_name(".env"), override=True)

# Guard against BOM on Windows (if Notepad saved .env as Unicode)
for k in list(os.environ.keys()):
    if k.startswith("\ufeff"):
        os.environ[k.lstrip("\ufeff")] = os.environ[k]

from fastapi.responses import RedirectResponse

app = FastAPI(
    title="English AI Tutor API",
    version="0.1.0",
    docs_url="/docs",        # Swagger UI
    redoc_url="/redoc",      # ReDoc
    openapi_url="/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://127.0.0.1:5173","http://localhost:3000","http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from .routes import debug, health, models, quizzes
app.include_router(debug.router)
app.include_router(health.router)
app.include_router(models.router)
app.include_router(quizzes.router)

@app.get("/")
def root():
    return RedirectResponse(url="/docs")

@app.get("/__ping")
def __ping():
    return {"ok": True}
