#!/usr/bin/env python3
"""
Minimal Rate Limiting Test Server
A simple FastAPI server to test rate limiting functionality
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from pydantic import BaseModel
import json
import time
import uuid

# Initialize rate limiter
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["1000/day", "100/hour"]
)

app = FastAPI(
    title="Rate Limiting Test API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add rate limiting middleware
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Custom rate limit exceeded handler
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    response = JSONResponse(
        status_code=429,
        content={
            "error": "Rate limit exceeded",
            "message": "You've reached your daily learning limit! Take a break and come back tomorrow to continue your English learning journey. 📚✨",
            "retry_after": exc.retry_after,
            "limit_type": "daily_quota",
            "educational_tip": "Learning is most effective with regular breaks. Try again tomorrow!",
            "suggestion": "Practice offline with the exercises you've already completed."
        }
    )
    response.headers["Retry-After"] = str(exc.retry_after)
    return response

# Models
class GrammarRequest(BaseModel):
    text: str
    mode: str = "minimal"

class GrammarResponse(BaseModel):
    corrected: str
    grammar_score: int
    context_score: int
    context_passed: bool
    score: int
    explanations: list = []
    context_feedback: list = []
    confidence: str = "medium"

# Routes
@app.get("/")
def root():
    return {"message": "Rate Limiting Test API", "status": "running"}

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "API is working", "rate_limits": "active"}

@app.post("/api/grammar/evaluate", response_model=GrammarResponse)
@limiter.limit("100/day; 20/hour; 5/minute")
async def evaluate_grammar(request: Request, grammar_request: GrammarRequest):
    """Grammar evaluation with rate limiting"""
    try:
        text = grammar_request.text.strip()
        word_count = len(text.split())
        
        # Simple scoring
        grammar_score = min(100, max(60, word_count * 5))
        context_score = min(100, max(70, word_count * 4))
        context_passed = word_count >= 10
        
        # Generate feedback
        explanations = []
        context_feedback = []
        
        if word_count < 10:
            explanations.append("Try to write at least 10 words for a complete description.")
            context_feedback.append("Your description is too short. Add more details about what you see.")
        else:
            explanations.append("Good job! You provided a detailed description.")
            context_feedback.append("Great description! You included good details about the image.")
        
        # Simple corrections
        corrected = text
        if not text.endswith('.'):
            corrected += '.'
        if corrected and corrected[0].islower():
            corrected = corrected[0].upper() + corrected[1:]
        
        response = GrammarResponse(
            corrected=corrected,
            grammar_score=grammar_score,
            context_score=context_score,
            context_passed=context_passed,
            score=int((grammar_score + context_score) / 2),
            explanations=explanations,
            context_feedback=context_feedback,
            confidence="high" if word_count >= 15 else "medium"
        )
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

@app.get("/api/images/list")
@limiter.limit("200/day; 50/hour; 10/minute")
def list_images(request: Request):
    """List available images with rate limiting"""
    return [
        {"id": "test-1", "path": "/images/test1.png", "level": "easy"},
        {"id": "test-2", "path": "/images/test2.png", "level": "medium"},
        {"id": "test-3", "path": "/images/test3.png", "level": "hard"}
    ]

@app.get("/api/rate-limit/status")
@limiter.limit("10/day")
def get_rate_limit_status(request: Request):
    """Get current rate limit status"""
    return {
        "message": "Rate limiting is active",
        "limits": {
            "grammar_evaluation": "100/day; 20/hour; 5/minute",
            "image_requests": "200/day; 50/hour; 10/minute",
            "status_checks": "10/day"
        },
        "educational_note": "These limits ensure fair usage and encourage regular learning breaks! 📚"
    }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Rate Limiting Test Server...")
    print("📊 Rate limits configured:")
    print("   - Grammar evaluation: 100/day; 20/hour; 5/minute")
    print("   - Image requests: 200/day; 50/hour; 10/minute")
    print("   - Status checks: 10/day")
    print("🌐 Server will be available at: http://localhost:8000")
    print("📚 API docs available at: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)
