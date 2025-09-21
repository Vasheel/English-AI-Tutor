from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import json
import random
import time
import uuid

app = FastAPI()

# Models
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

# Image data
IMAGES = [
    {"id": "easy-01", "path": "/images/prompts/easy/img_1.png", "level": "easy", "title": "A dog playing fetch with a red ball", "alt": "A brown, white, and black dog running on green grass, holding a red ball in its mouth", "objects": ["dog", "ball", "grass"], "actions": ["running", "holding", "playing", "carrying"], "locations": ["park", "grass", "outdoors"]},
    {"id": "easy-02", "path": "/images/prompts/easy/img_2.png", "level": "easy", "title": "A girl reading a book on the grass", "alt": "Smiling young girl lying on the grass outdoors while reading a book", "objects": ["girl", "book", "grass"], "actions": ["read", "lie down", "smile"], "locations": ["grass", "garden", "outdoor", "park"]},
    {"id": "easy-03", "path": "/images/prompts/easy/img_3.png", "level": "easy", "title": "A boy riding a bicycle", "alt": "A young boy wearing a helmet riding a bicycle on a path", "objects": ["boy", "bicycle", "helmet", "path"], "actions": ["ride", "pedal", "balance"], "locations": ["outdoor", "street", "path"]},
    {"id": "easy-04", "path": "/images/prompts/easy/img_4.png", "level": "easy", "title": "A cat sleeping on a chair", "alt": "A gray cat lying stretched out and sleeping on a black chair indoors", "objects": ["cat", "chair"], "actions": ["sleep", "rest", "lie down"], "locations": ["chair", "indoor", "room"]},
    {"id": "easy-05", "path": "/images/prompts/easy/img_5.png", "level": "easy", "title": "A man drinking water from a bottle", "alt": "Young man in a blue shirt drinking water from a plastic bottle under the clear sky", "objects": ["man", "bottle", "water"], "actions": ["drink", "hold", "refresh"], "locations": ["outdoor", "sky", "daytime"]},
    {"id": "easy-06", "path": "/images/prompts/easy/img_6.png", "level": "easy", "title": "Cars parked along a street", "alt": "Row of cars parked on both sides of a city street", "objects": ["cars", "street", "trees"], "actions": ["park", "line up"], "locations": ["street", "city", "outdoor"]},
    {"id": "easy-07", "path": "/images/prompts/easy/img_7.png", "level": "easy", "title": "A seagull flying in the sky", "alt": "White seagull with outstretched wings flying against a clear blue sky", "objects": ["seagull", "sky", "clouds"], "actions": ["fly", "soar", "glide"], "locations": ["sky", "outdoor", "daytime"]},
    {"id": "easy-08", "path": "/images/prompts/easy/img_8.png", "level": "easy", "title": "A boy eating an apple", "alt": "Smiling young boy in a blue shirt taking a bite from a red apple", "objects": ["boy", "apple"], "actions": ["eat", "bite", "hold"], "locations": ["indoor", "room", "background"]},
    {"id": "medium-01", "path": "/images/prompts/medium/img_1.png", "level": "medium", "title": "A teacher writing on a chalkboard", "alt": "Male teacher in a suit writing mathematical formulas and diagrams on a classroom chalkboard", "objects": ["teacher", "chalkboard", "chalk", "formulas"], "actions": ["write", "teach", "explain"], "locations": ["classroom", "indoor", "school"]},
    {"id": "medium-02", "path": "/images/prompts/medium/img_2.png", "level": "medium", "title": "A girl painting outdoors", "alt": "Young girl standing in front of an easel painting on a canvas in the garden", "objects": ["girl", "canvas", "paintbrush", "easel", "palette"], "actions": ["paint", "create", "stand"], "locations": ["outdoor", "garden", "yard"]},
    {"id": "medium-03", "path": "/images/prompts/medium/img_3.png", "level": "medium", "title": "A dog chasing a cat", "alt": "Black dog running after a striped cat across a grassy field at sunset", "objects": ["dog", "cat", "grass"], "actions": ["chase", "run", "jump"], "locations": ["field", "outdoor", "sunset"]},
    {"id": "medium-04", "path": "/images/prompts/medium/img_4.png", "level": "medium", "title": "A farmer feeding chickens", "alt": "Smiling farmer in orange overalls holding a bucket and scattering feed for chickens on a farm", "objects": ["farmer", "bucket", "chickens", "barn"], "actions": ["feed", "walk", "scatter"], "locations": ["farm", "field", "outdoor"]},
    {"id": "medium-05", "path": "/images/prompts/medium/img_5.png", "level": "medium", "title": "Two boys playing football", "alt": "Two happy boys playing with a colorful football on the grass", "objects": ["boys", "football", "grass"], "actions": ["kick", "play", "run"], "locations": ["field", "outdoor", "park"]},
    {"id": "medium-06", "path": "/images/prompts/medium/img_6.png", "level": "medium", "title": "A family eating dinner together", "alt": "Happy family of four sitting at a table eating dinner and smiling", "objects": ["family", "table", "food", "plates"], "actions": ["eat", "talk", "smile"], "locations": ["dining room", "home", "indoor"]},
    {"id": "medium-07", "path": "/images/prompts/medium/img_7.png", "level": "medium", "title": "A boy building a sandcastle", "alt": "Young boy in sunglasses and a straw hat playing with a sandcastle on the beach", "objects": ["boy", "sandcastle", "bucket", "spade"], "actions": ["build", "dig", "play"], "locations": ["beach", "sand", "outdoor"]},
    {"id": "hard-01", "path": "/images/prompts/hard/img_1.png", "level": "hard", "title": "Children playing and reading under a tree", "alt": "Two children playing with a ball while another child sits under a tree reading a book", "objects": ["children", "ball", "tree", "book"], "actions": ["play", "read", "sit", "throw"], "locations": ["park", "outdoor", "garden"]},
    {"id": "hard-02", "path": "/images/prompts/hard/img_2.png", "level": "hard", "title": "Students raising hands in a classroom", "alt": "Group of school children sitting at desks raising their hands while a teacher stands at the front", "objects": ["students", "teacher", "desks", "blackboard"], "actions": ["raise hand", "sit", "teach"], "locations": ["classroom", "school", "indoor"]},
    {"id": "hard-03", "path": "/images/prompts/hard/img_3.png", "level": "hard", "title": "People shopping at a market", "alt": "Crowd of people buying and selling fruits and vegetables at an outdoor market", "objects": ["people", "fruits", "vegetables", "baskets", "stalls"], "actions": ["buy", "sell", "shop", "talk"], "locations": ["market", "outdoor", "street"]},
    {"id": "hard-04", "path": "/images/prompts/hard/img_4.png", "level": "hard", "title": "Busy street with cyclists and vehicles", "alt": "Several people riding bicycles, cars and buses moving, and pedestrians crossing the street in a city", "objects": ["bicycles", "cars", "buses", "people"], "actions": ["ride", "walk", "drive", "cross"], "locations": ["city", "street", "crosswalk"]},
    {"id": "hard-05", "path": "/images/prompts/hard/img_5.png", "level": "hard", "title": "Football players arguing with referee", "alt": "Two football players in blue shirts pointing and arguing with the referee while another player lies injured on the ground", "objects": ["players", "referee", "ball", "stadium"], "actions": ["argue", "point", "fall", "judge"], "locations": ["stadium", "football field", "outdoor"]},
    {"id": "hard-06", "path": "/images/prompts/hard/img_6.png", "level": "hard", "title": "Visitors watching a lion in a cage", "alt": "Group of people taking photos while a zookeeper feeds a lion standing on its hind legs behind a fence", "objects": ["lion", "people", "camera", "zookeeper", "fence"], "actions": ["watch", "feed", "take photo", "stand"], "locations": ["zoo", "outdoor", "cage"]},
    {"id": "hard-07", "path": "/images/prompts/hard/img_7.png", "level": "hard", "title": "Vendors selling food at a train station", "alt": "Men selling snacks and drinks from a cart beside a blue train at a busy station", "objects": ["train", "vendors", "food", "cart", "people"], "actions": ["sell", "buy", "stand", "wait"], "locations": ["train station", "platform", "outdoor"]},
    {"id": "hard-08", "path": "/images/prompts/hard/img_8.png", "level": "hard", "title": "Children celebrating a birthday party", "alt": "Group of children wearing party hats sitting around a table with cake, balloons, and presents", "objects": ["children", "cake", "balloons", "hats", "presents"], "actions": ["celebrate", "eat", "smile", "party"], "locations": ["party", "indoor", "home"]},
]

# Routes
@app.get("/")
def root():
    return {"message": "English AI Tutor API", "status": "running"}

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "API is working"}

# Image API endpoints
@app.get("/api/images/list")
def list_images(level: str = None):
    if level:
        return [i for i in IMAGES if i["level"] == level]
    return IMAGES

@app.get("/api/images/next")
def get_next_image(current_id: str, level: str):
    """Get the next image in sequence for the given level"""
    level_images = [i for i in IMAGES if i["level"] == level]
    
    if not level_images:
        return {"error": "No images found for this level"}
    
    # Find current image index
    current_index = -1
    for i, img in enumerate(level_images):
        if img["id"] == current_id:
            current_index = i
            break
    
    if current_index == -1:
        return {"error": "Current image not found"}
    
    # Get next image (wrap around to beginning)
    next_index = (current_index + 1) % len(level_images)
    next_image = level_images[next_index]
    
    return {
        "next_image": next_image,
        "current_index": current_index,
        "total_images": len(level_images),
        "will_wrap": next_index == 0
    }

# Grammar API endpoints
@app.post("/api/grammar/evaluate")
async def evaluate_grammar(request: GrammarRequest):
    """
    Simple grammar evaluation endpoint for image quiz
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

# Quiz API endpoints
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

# Export for Vercel
handler = app
