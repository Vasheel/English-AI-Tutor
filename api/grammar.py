from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import json

app = FastAPI()

class GrammarRequest(BaseModel):
    text: str
    mode: str = "minimal"
    dialect: str = "en-US"
    grade_level: int = 6
    image_url: str = None
    image_id: str = None

class GrammarResponse(BaseModel):
    corrected: str
    grammar_score: int
    context_score: int
    context_passed: bool
    score: int
    explanations: list = []
    context_feedback: list = []
    confidence: str = "medium"

@app.post("/api/grammar/evaluate")
async def evaluate_grammar(request: GrammarRequest):
    """
    Simple grammar evaluation endpoint for image quiz
    This is a basic implementation - in production you'd want to use OpenAI or similar
    """
    try:
        # Basic grammar check (simplified)
        text = request.text.strip()
        
        # Simple scoring based on word count and basic checks
        word_count = len(text.split())
        grammar_score = min(100, max(60, word_count * 5))  # Basic scoring
        
        # Context scoring (simplified)
        context_score = min(100, max(70, word_count * 4))
        context_passed = word_count >= 10
        
        # Generate basic feedback
        explanations = []
        context_feedback = []
        
        if word_count < 10:
            explanations.append("Try to write at least 10 words for a complete description.")
            context_feedback.append("Your description is too short. Add more details about what you see.")
        else:
            explanations.append("Good job! You provided a detailed description.")
            context_feedback.append("Great description! You included good details about the image.")
        
        # Simple corrections (basic)
        corrected = text
        if not text.endswith('.'):
            corrected += '.'
        
        # Capitalize first letter
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

@app.get("/api/grammar/health")
def health_check():
    return {"status": "ok", "message": "Grammar API is working"}

# Export for Vercel
handler = app
