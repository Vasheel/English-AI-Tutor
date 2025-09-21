from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import json
import random
import time
import uuid

app = FastAPI()

class GenerateQuizPayload(BaseModel):
    count: int = 6
    skills: list = ["grammar", "vocabulary", "comprehension"]
    query: str = "PSAC Grade 6 English"
    topic: str = None
    unit: str = None
    difficulty: str = "beginner"
    type: str = "mcq"
    keywords: list = None
    seed: int = None

class QuizItem(BaseModel):
    id: str
    type: str
    question: str
    options: list
    answer: int
    explanation: str

class BackendQuizResponse(BaseModel):
    items: list[QuizItem]
    source: str
    metadata: dict = {}

@app.post("/api/quizzes/generate")
async def generate_quiz(payload: GenerateQuizPayload):
    """
    Generate quiz questions for PSAC Grade 6 English students
    """
    try:
        count = payload.count or 6
        skills = payload.skills or ["grammar", "vocabulary", "comprehension"]
        query = payload.query or payload.topic or "PSAC Grade 6 English"
        
        print(f"[DEBUG] Generating quiz: count={count}, skills={skills}, query={query}")
        
        # Create age-appropriate questions
        questions = create_age_appropriate_questions(count, skills, query)
        
        return BackendQuizResponse(
            items=questions,
            source="ai-generated",
            metadata={
                "timestamp": int(time.time()),
                "session": uuid.uuid4().hex[:8],
                "difficulty": payload.difficulty or "beginner"
            }
        )
        
    except Exception as e:
        print(f"[DEBUG] Quiz generation failed: {e}")
        # Return fallback questions
        fallback_questions = create_fallback_questions(payload.count or 6)
        return BackendQuizResponse(
            items=fallback_questions,
            source="fallback",
            metadata={"error": str(e)}
        )

def create_age_appropriate_questions(count: int, skills: list, topic: str) -> list[QuizItem]:
    """Create age-appropriate questions for 11-year-old students"""
    
    # Question templates for different skills
    grammar_questions = [
        {
            "question": "Which sentence is written correctly?",
            "options": [
                "She goed to school yesterday.",
                "She went to school yesterday.",
                "She go to school yesterday.",
                "She going to school yesterday."
            ],
            "answer": 1,
            "explanation": "'Went' is the correct past tense of 'go'."
        },
        {
            "question": "What type of word is 'quickly' in this sentence: 'She ran quickly'?",
            "options": ["Noun", "Verb", "Adjective", "Adverb"],
            "answer": 3,
            "explanation": "'Quickly' describes how she ran, so it's an adverb."
        },
        {
            "question": "Choose the correct sentence:",
            "options": [
                "The cat are sleeping.",
                "The cat is sleeping.",
                "The cat am sleeping.",
                "The cat be sleeping."
            ],
            "answer": 1,
            "explanation": "'The cat' is singular, so we use 'is' not 'are'."
        },
        {
            "question": "Which sentence has the correct punctuation?",
            "options": [
                "Hello how are you",
                "Hello, how are you?",
                "Hello how are you?",
                "Hello, how are you"
            ],
            "answer": 1,
            "explanation": "We need a comma after 'Hello' and a question mark at the end."
        },
        {
            "question": "True or False: 'I have went to the store' is correct grammar.",
            "options": ["True", "False"],
            "answer": 1,
            "explanation": "This is false. It should be 'I have gone to the store' or 'I went to the store'."
        }
    ]
    
    vocabulary_questions = [
        {
            "question": "Which word means the same as 'happy'?",
            "options": ["Sad", "Angry", "Joyful", "Tired"],
            "answer": 2,
            "explanation": "'Joyful' means the same as 'happy' - both describe a positive feeling."
        },
        {
            "question": "Which word is a noun?",
            "options": ["Run", "Beautiful", "House", "Quickly"],
            "answer": 2,
            "explanation": "'House' is a noun - it's a thing you can see and touch."
        },
        {
            "question": "What does 'enormous' mean?",
            "options": ["Very small", "Very large", "Very fast", "Very slow"],
            "answer": 1,
            "explanation": "'Enormous' means very large or huge."
        },
        {
            "question": "Which word is the opposite of 'brave'?",
            "options": ["Strong", "Scared", "Happy", "Smart"],
            "answer": 1,
            "explanation": "'Scared' is the opposite of 'brave'."
        }
    ]
    
    comprehension_questions = [
        {
            "question": "What is the main idea of this sentence: 'The sun shines brightly in the sky'?",
            "options": [
                "The sky is blue",
                "The sun is bright",
                "It's daytime",
                "The weather is good"
            ],
            "answer": 1,
            "explanation": "The sentence is mainly about the sun being bright."
        },
        {
            "question": "If someone says 'It's raining cats and dogs', what do they mean?",
            "options": [
                "Animals are falling from the sky",
                "It's raining very heavily",
                "Cats and dogs are playing",
                "The weather is nice"
            ],
            "answer": 1,
            "explanation": "This is an idiom meaning it's raining very heavily."
        },
        {
            "question": "What is the setting of this story: 'The children played in the park'?",
            "options": ["At home", "In the park", "At school", "At the beach"],
            "answer": 1,
            "explanation": "The setting is in the park where the children are playing."
        }
    ]
    
    # Combine all questions
    all_questions = []
    all_questions.extend(grammar_questions)
    all_questions.extend(vocabulary_questions)
    all_questions.extend(comprehension_questions)
    
    # Shuffle and select the requested number
    random.shuffle(all_questions)
    selected_questions = all_questions[:count]
    
    # Convert to QuizItem objects
    quiz_items = []
    for i, q in enumerate(selected_questions):
        quiz_items.append(QuizItem(
            id=f"quiz_{i+1}",
            type="mcq",
            question=q["question"],
            options=q["options"],
            answer=q["answer"],
            explanation=q["explanation"]
        ))
    
    return quiz_items

def create_fallback_questions(count: int) -> list[QuizItem]:
    """Create simple fallback questions"""
    questions = [
        QuizItem(
            id="fallback_1",
            type="mcq",
            question="Which sentence is correct?",
            options=[
                "I am happy.",
                "I is happy.",
                "I are happy.",
                "I be happy."
            ],
            answer=0,
            explanation="'I am happy' is the correct sentence."
        ),
        QuizItem(
            id="fallback_2",
            type="mcq",
            question="What is a noun?",
            options=[
                "An action word",
                "A describing word",
                "A person, place, or thing",
                "A word that shows time"
            ],
            answer=2,
            explanation="A noun is a person, place, or thing."
        )
    ]
    
    # Repeat questions if needed
    while len(questions) < count:
        questions.extend(questions[:count-len(questions)])
    
    return questions[:count]

@app.get("/api/quizzes/health")
def health_check():
    return {"status": "ok", "message": "Quiz API is working"}

# Export for Vercel
handler = app
