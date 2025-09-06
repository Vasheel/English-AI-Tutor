# server/app.py
from pathlib import Path
from dotenv import load_dotenv
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load env from server/.env and override anything stale
load_dotenv(dotenv_path=Path(__file__).with_name(".env"), override=True)

# Guard against BOM on Windows
for k in list(os.environ.keys()):
    if k.startswith("\ufeff"):
        os.environ[k.lstrip("\ufeff")] = os.environ[k]

from fastapi.responses import RedirectResponse

app = FastAPI(
    title="English AI Tutor API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Updated CORS to include port 8080
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from .routes import debug, health, models, quizzes, images, grammar, chat
app.include_router(debug.router)
app.include_router(health.router)
app.include_router(models.router)
app.include_router(quizzes.router)
app.include_router(images.router)
app.include_router(grammar.router)
app.include_router(chat.router)

@app.get("/")
def root():
    return RedirectResponse(url="/docs")

@app.get("/__ping")
def __ping():
    return {"ok": True}