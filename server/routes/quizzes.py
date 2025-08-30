# server/routes/quizzes.py - Enhanced with better debugging and error handling
from fastapi import APIRouter, HTTPException
from openai import OpenAI
import os, json, uuid, traceback
from ..structured_schema import QUIZ_RESPONSE_FORMAT
from ..quiz_schema import GenerateQuizPayload, BackendQuizResponse, QuizItem

# Safe retriever import
try:
    from ..retriever import search as rag_search
except Exception:
    rag_search = None

router = APIRouter(prefix="/api/quizzes", tags=["quizzes"])

def get_openai_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    print(f"[DEBUG] API Key present: {'Yes' if api_key and api_key.startswith('sk-') else 'No'}")
    print(f"[DEBUG] API Key length: {len(api_key) if api_key else 0}")
    
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is missing")
    if not api_key.startswith('sk-'):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY format appears invalid")
    
    return OpenAI(api_key=api_key)

def resolve_model(client: OpenAI) -> tuple[str, str]:
    configured = os.getenv("MODEL_NAME", "gpt-4o-mini")
    print(f"[DEBUG] Configured model: {configured}")
    
    try:
        model_info = client.models.retrieve(configured)
        print(f"[DEBUG] Model validation successful: {model_info.id}")
        return configured, "configured"
    except Exception as e:
        print(f"[DEBUG] Model validation failed: {e}")
        # Try fallback model
        try:
            fallback = "gpt-4o-mini"
            client.models.retrieve(fallback)
            print(f"[DEBUG] Using fallback model: {fallback}")
            return fallback, "fallback"
        except Exception as e2:
            print(f"[DEBUG] Fallback model also failed: {e2}")
            # Try another common model
            try:
                gpt35 = "gpt-3.5-turbo"
                client.models.retrieve(gpt35)
                print(f"[DEBUG] Using GPT-3.5-turbo as last resort")
                return gpt35, "last_resort"
            except Exception as e3:
                print(f"[DEBUG] All models failed: {e3}")
                raise HTTPException(status_code=500, detail="No available OpenAI models")

@router.post("/generate")
def generate_quiz(payload: GenerateQuizPayload):
    print(f"[DEBUG] Received payload: {payload}")
    
    # Normalize inputs
    count = payload.count or payload.num_questions or 6
    skills = payload.skills or ["grammar"]
    query_text = payload.query or payload.topic or "PSAC Grade 6 English"
    unit = payload.unit
    
    print(f"[DEBUG] Normalized - count: {count}, skills: {skills}, query: {query_text}, unit: {unit}")

    try:
        # Test OpenAI client creation
        client = get_openai_client()
        print("[DEBUG] OpenAI client created successfully")
        
        # Test model resolution
        model, resolved_from = resolve_model(client)
        print(f"[DEBUG] Model resolved: {model} (from: {resolved_from})")
        
    except Exception as e:
        print(f"[DEBUG] Client/Model setup failed: {e}")
        print(f"[DEBUG] Full traceback: {traceback.format_exc()}")
        return create_fallback_response(count, f"OpenAI setup failed: {str(e)}")

    # RAG call (optional)
    passages = []
    if rag_search:
        try:
            passages = rag_search(query=query_text, k=6, unit=unit, skills=skills, seed=payload.seed)
            print(f"[DEBUG] RAG retrieved {len(passages)} passages")
        except Exception as e:
            print(f"[DEBUG] RAG retrieval failed: {e}")

    # Prepare OpenAI request
    try:
        system_prompt = (
            "You are a PSAC Grade 6 English quiz generator for Mauritius students. "
            "Generate quiz questions that are appropriate for Grade 6 level. "
            "Return ONLY valid JSON in this exact format: "
            '{"items": [{"id": "q1", "type": "mcq", "question": "What is the past tense of \'go\'?", "options": ["went", "goes", "going", "gone"], "answer": 0, "explanation": "The past tense of \'go\' is \'went\'"}]}'
        )
        
        user_prompt = (
            f"Generate {count} quiz questions for Grade 6 English students in Mauritius (PSAC level). "
            f"Focus on these skills: {', '.join(skills)}. "
            f"Topic/Unit: {query_text} (Unit {unit}). "
            f"Keywords to include: {', '.join(payload.keywords or [])}. "
            f"Make questions appropriate for Grade 6 level and relevant to Mauritius PSAC curriculum."
        )
        
        print(f"[DEBUG] System prompt length: {len(system_prompt)}")
        print(f"[DEBUG] User prompt: {user_prompt[:200]}...")
        
        # Make OpenAI API call
        print("[DEBUG] Making OpenAI API call...")
        chat = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=2000  # Ensure we get complete responses
        )
        
        print("[DEBUG] OpenAI API call successful")
        content = chat.choices[0].message.content.strip()
        print(f"[DEBUG] Raw OpenAI response length: {len(content)}")
        print(f"[DEBUG] Raw OpenAI response preview: {content[:300]}...")
        
        # Parse JSON response
        try:
            data = json.loads(content)
            print(f"[DEBUG] JSON parsing successful, keys: {list(data.keys())}")
        except json.JSONDecodeError as e:
            print(f"[DEBUG] JSON parsing failed: {e}")
            print(f"[DEBUG] Full content that failed: {repr(content)}")
            return create_fallback_response(count, f"Invalid JSON from OpenAI: {str(e)}")

        # Extract quiz items
        quiz_items = []
        if "items" in data:
            quiz_items = data["items"]
        elif "questions" in data:
            quiz_items = data["questions"]
        elif isinstance(data, list):
            quiz_items = data
        else:
            print(f"[DEBUG] Unexpected data structure: {data}")
            return create_fallback_response(count, f"Unexpected response structure from OpenAI")

        print(f"[DEBUG] Extracted {len(quiz_items)} quiz items")
        
        # Normalize quiz items
        normalized_items = []
        for i, q in enumerate(quiz_items):
            try:
                # Ensure required fields
                q_id = q.get("id", f"ai_q_{i+1}")
                q_type = q.get("type", "mcq")
                question = q.get("question") or q.get("prompt", f"Question {i+1}")
                options = q.get("options", [])
                answer = q.get("answer", 0)
                explanation = q.get("explanation", "No explanation provided")
                
                item = QuizItem(
                    id=q_id,
                    type=q_type,
                    question=question,
                    options=options,
                    answer=answer,
                    explanation=explanation
                )
                normalized_items.append(item)
                print(f"[DEBUG] Normalized item {i+1}: {item.question[:50]}...")
                
            except Exception as e:
                print(f"[DEBUG] Failed to normalize item {i}: {e}")
                print(f"[DEBUG] Problematic item: {q}")
                continue

        if not normalized_items:
            print("[DEBUG] No items could be normalized")
            return create_fallback_response(count, "Failed to normalize any quiz items")

        final_items = normalized_items[:count]
        print(f"[DEBUG] Returning {len(final_items)} items, source: llm")
        
        return BackendQuizResponse(
            items=final_items,
            source="llm"
        )

    except Exception as e:
        print(f"[DEBUG] OpenAI request failed: {e}")
        print(f"[DEBUG] Full traceback: {traceback.format_exc()}")
        return create_fallback_response(count, f"OpenAI request failed: {str(e)}")

def create_fallback_response(count: int, error_reason: str) -> BackendQuizResponse:
    """Create fallback response with debugging info"""
    print(f"[DEBUG] Creating fallback response, reason: {error_reason}")
    
    fallback_items = [
        QuizItem(
            id="fallback_1", 
            type="mcq", 
            question="What is the past tense of 'eat'?", 
            options=["ate", "eating", "eats", "eaten"], 
            answer=0, 
            explanation="The past tense of 'eat' is 'ate'"
        ),
        QuizItem(
            id="fallback_2", 
            type="mcq", 
            question="Which word is a noun?", 
            options=["run", "quickly", "book", "happy"], 
            answer=2, 
            explanation="'Book' is a noun - it names a thing"
        ),
        QuizItem(
            id="fallback_3", 
            type="fitb", 
            question="I ___ to school every day.", 
            answer="go", 
            explanation="'Go' is the correct present tense verb"
        ),
        QuizItem(
            id="fallback_4", 
            type="mcq", 
            question="What type of sentence is this: 'Close the door!'?", 
            options=["statement", "question", "command", "exclamation"], 
            answer=2, 
            explanation="This is a command sentence - it tells someone to do something"
        )
    ]
    
    return BackendQuizResponse(
        items=fallback_items[:count],
        source=f"fallback ({error_reason})"
    )