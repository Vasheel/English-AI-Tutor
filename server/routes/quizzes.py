# server/routes/quizzes.py - Enhanced with better variety and challenging questions
from fastapi import APIRouter, HTTPException
from openai import OpenAI
import os, json, uuid, traceback, random, time, hashlib, re
from ..structured_schema import QUIZ_RESPONSE_FORMAT
from ..quiz_schema import GenerateQuizPayload, BackendQuizResponse, QuizItem

# Safe retriever import
try:
    from ..retriever import search as rag_search
except Exception:
    rag_search = None

router = APIRouter(prefix="/api/quizzes", tags=["quizzes"])

# Question variety templates
QUESTION_FORMATS = [
    "multiple choice about {topic}",
    "fill in the blank for {topic}",
    "true or false regarding {topic}",
    "identify the error in {topic}",
    "choose the synonym/antonym for {topic}",
    "complete the sentence using {topic}",
    "match the definition with {topic}",
    "rewrite the sentence applying {topic}"
]

QUESTION_CONTEXTS = [
    "in a school setting",
    "at home with family",
    "during a sports activity",
    "while reading a book",
    "in Port Louis market",
    "during a Mauritian festival",
    "at the beach",
    "in a classroom discussion",
    "while helping parents",
    "with friends at play"
]

# Challenging start patterns to avoid repetitive simple questions
START_PATTERNS = [
    "complex grammar rule",
    "advanced vocabulary in context",
    "reading comprehension with inference",
    "identify the error",
    "sentence transformation",
    "figurative language",
    "text analysis",
    "parallel structure",
    "verb tenses and aspects",
    "punctuation and mechanics"
]

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
    skills = payload.skills or ["grammar", "vocabulary", "comprehension"]
    query_text = payload.query or payload.topic or "PSAC Grade 6 English"
    unit = payload.unit
    
    # Force variety by shuffling skills
    random.shuffle(skills)
    
    # Add complexity variations for harder questions
    if len(skills) == 1:
        skill_variations = {
            "grammar": ["complex sentences", "advanced punctuation", "passive voice", "reported speech", "conditionals"],
            "vocabulary": ["idioms", "phrasal verbs", "word formation", "contextual meanings", "advanced synonyms"],
            "comprehension": ["inference", "author's purpose", "critical analysis", "figurative language", "text structure"],
            # Handle the enhanced skills from frontend
            "complex grammar": ["subjunctive mood", "parallel structure", "dangling modifiers", "verb aspects"],
            "advanced vocabulary": ["etymology", "connotation vs denotation", "register and formality", "collocations"],
            "critical comprehension": ["implicit meanings", "tone and mood", "rhetorical devices", "argument analysis"]
        }
        base_skill = skills[0].replace("complex ", "").replace("advanced ", "").replace("critical ", "")
        skills = skills + random.sample(
            skill_variations.get(skills[0], skill_variations.get(base_skill, [])), 
            min(2, len(skill_variations.get(skills[0], skill_variations.get(base_skill, []))))
        )
    
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
        return create_challenging_fallback_response(count)

    # RAG call (optional)
    passages = []
    if rag_search:
        try:
            passages = rag_search(query=query_text, k=6, unit=unit, skills=skills, seed=payload.seed)
            print(f"[DEBUG] RAG retrieved {len(passages)} passages")
        except Exception as e:
            print(f"[DEBUG] RAG retrieval failed: {e}")

    # If the client asked for a cloze test, produce a cloze object instead of MCQ
    if (payload.type or "").lower() == "cloze":
        try:
            client = get_openai_client()
            model, _ = resolve_model(client)
            system = "You generate PSAC Grade 6 English CLOZE tests. Return ONLY strict JSON."
            # Map difficulty names
            diff = (payload.difficulty or "beginner").lower()
            prompt = (
                "Create ONE short cloze passage with 5-7 blanks. "
                "Use everyday topics for beginner, school/science for intermediate, and abstract/current affairs for advanced.\n"
                "Return JSON with keys: title, text, answers, topic.\n"
                "- text: full passage where each blank is represented by 5 underscores (_____).\n"
                "- answers: array of the missing words in order.\n"
                f"Difficulty: {diff}."
            )
            resp = client.chat.completions.create(
                model=model,
                messages=[{"role":"system","content":system},{"role":"user","content":prompt}],
                temperature=0.7,
                response_format={"type":"json_object"}
            )
            raw = resp.choices[0].message.content or "{}"
            data = json.loads(raw)
            text = data.get("text") or data.get("passage")
            answers = data.get("answers") or []
            title = data.get("title") or "AI Cloze"
            if not text or not answers:
                raise ValueError("missing text/answers")
            return BackendQuizResponse(
                cloze={
                    "title": title,
                    "text": text,
                    "answers": answers,
                    "topic": data.get("topic", "AI Generated")
                },
                source="llm"
            )
        except Exception as e:
            print(f"[DEBUG] Cloze generation failed: {e}")
            # fallthrough to MCQ pipeline below as a backup

    # Prepare OpenAI request with enhanced variety and difficulty
    try:
        # Select random starting pattern to avoid repetition
        random_start = random.choice(START_PATTERNS)
        selected_formats = random.sample(QUESTION_FORMATS, min(count, len(QUESTION_FORMATS)))
        selected_contexts = random.sample(QUESTION_CONTEXTS, min(count, len(QUESTION_CONTEXTS)))
        
        print(f"[DEBUG] Using random start pattern: {random_start}")
        
        # ENHANCED system prompt for CHALLENGING questions (MCQ ONLY)
        system_prompt = (
            "You are a PSAC Grade 6 English quiz generator for ADVANCED students in Mauritius. "
            "Generate CHALLENGING questions that require critical thinking and deep understanding. "
            "\n\nCRITICAL FORMAT REQUIREMENT:\n"
            "ALL questions MUST be in MULTIPLE CHOICE format with EXACTLY 4 options.\n"
            "NEVER generate open-ended, analysis, or essay questions.\n"
            "NEVER ask students to 'explain', 'analyze', or 'describe' without options.\n"
            "ALWAYS provide 4 clickable options (A, B, C, D) for EVERY question.\n"
            "\n\nEXAMPLES OF CORRECT MCQ FORMAT:\n"
            "- 'Which word best describes the protagonist's emotional state?' + 4 options\n"
            "- 'What can be inferred from this sentence?' + 4 options\n"
            "- 'Choose the correct interpretation:' + 4 options\n"
            "\n\nEXAMPLES OF WRONG FORMAT (DO NOT USE):\n"
            "- 'Analyze the following sentence and explain...'\n"
            "- 'Describe what can be inferred...'\n"
            "- Any question without exactly 4 options\n"
            "\n\nReturn ONLY valid JSON in this exact format:\n"
            '{"items": [{"id": "q1", "type": "mcq", '
            '"question": "Question text with a clear prompt?", '
            '"options": ["Option A", "Option B", "Option C", "Option D"], '
            '"answer": 0, "explanation": "Explanation"}]}'
            '\nEVERY item MUST have "type": "mcq" and exactly 4 options.'
        )
        
        # Create variety instructions with challenging focus
        variety_instructions = []
        for i in range(count):
            format_idx = i % len(selected_formats)
            context_idx = i % len(selected_contexts)
            skill_idx = i % len(skills)
            
            # Ensure first question is never a simple synonym
            if i == 0:
                instruction = (
                    f"Question 1: MUST be a {random_start} question - "
                    f"NOT a simple synonym or basic definition. "
                    f"Make it challenging and thought-provoking. "
                )
            else:
                instruction = (
                    f"Question {i+1}: Use {selected_formats[format_idx].format(topic=skills[skill_idx])} "
                    f"{selected_contexts[context_idx]}. "
                )
            variety_instructions.append(instruction)
        
        # Dynamic user prompt with strong emphasis on MCQ-only format
        # Prepare dynamic identifiers for this request
        timestamp = int(time.time())
        session_id = uuid.uuid4().hex[:8]

        user_prompt = (
            f"Generate EXACTLY {count} MULTIPLE CHOICE questions (MCQ only!) for ADVANCED Grade 6 English students. "
            f"Topic: {query_text}. Skills: {', '.join(skills)}. "
            f"\n\nFORMAT REQUIREMENTS:\n"
            f"1. EVERY question MUST be multiple choice with 4 options\n"
            f"2. NEVER ask for written explanations or analysis\n"
            f"3. Convert ANY question type to MCQ format:\n"
            f"   - Instead of 'Analyze X', use 'Which best describes X?' with 4 options\n"
            f"   - Instead of 'Explain Y', use 'What does Y mean?' with 4 options\n"
            f"   - Instead of 'Describe Z', use 'Which statement about Z is correct?' with 4 options\n"
            f"4. The 'type' field MUST always be 'mcq'\n"
            f"5. The 'answer' field MUST be a number 0-3 (index of correct option)\n"
            f"\n\nVARIETY INSTRUCTIONS:\n" + "\n".join(variety_instructions) +
            f"\n\nDO NOT generate questions that ask students to write, type, or explain anything.\n"
            f"ONLY generate questions where students click one of 4 options.\n"
            f"\nRandomization: {random.randint(100000, 999999)}\n"
            f"Timestamp: {timestamp}\n"
            f"Session ID: {session_id}"
        )

        # Create a unique hash for this request to discourage repetition across runs
        request_hash = hashlib.md5(f"{timestamp}{session_id}{random.random()}".encode()).hexdigest()[:8]
        user_prompt += (
            f"\n\nUNIQUE REQUEST ID: {request_hash}" 
            f"\n\nAVOID these patterns from previous quizzes:" 
            f"\n- Do NOT use 'ocean roared' or similar wave/water metaphors" 
            f"\n- Do NOT ask about figurative language in nature descriptions" 
            f"\n- Create COMPLETELY NEW question topics"
        )
        
        if payload.keywords:
            user_prompt += f"\nKeywords to incorporate creatively: {', '.join(payload.keywords)}"
        
        print(f"[DEBUG] System prompt length: {len(system_prompt)}")
        print(f"[DEBUG] User prompt preview: {user_prompt[:300]}...")
        
        # Make OpenAI API call with parameters optimized for variety and difficulty
        print("[DEBUG] Making OpenAI API call with variety parameters...")
        
        # Use seed parameter if available (OpenAI API v1.1.0+)
        api_params = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            # Slightly lower temperature for better JSON stability while keeping variety
            "temperature": 0.7,
            "max_tokens": 2000,
            "presence_penalty": 0.5,
            "frequency_penalty": 0.5,
            "top_p": 0.9,
            # Force strict JSON response from the model
            "response_format": {"type": "json_object"}
        }
        
        # Add seed if using newer OpenAI API
        try:
            api_params["seed"] = random.randint(0, 1000000)
        except:
            pass  # Older API versions don't support seed
        
        chat = client.chat.completions.create(**api_params)
        
        print("[DEBUG] OpenAI API call successful")
        raw_content = (chat.choices[0].message.content or "").strip()
        print(f"[DEBUG] Raw OpenAI response length: {len(raw_content)}")
        print(f"[DEBUG] Raw OpenAI response preview: {raw_content[:300]}...")

        # Sanitize common formatting issues (code fences, NBSP, stray chars)
        content = raw_content.replace("\xa0", " ").replace("\u200b", "").replace("\ufeff", "").strip()
        if content.startswith("```"):
            fence_match = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", content)
            if fence_match:
                content = fence_match.group(1)

        # Extract the largest JSON object if the model added extra text
        obj_match = re.search(r"\{[\s\S]*\}\s*$", content)
        if obj_match:
            content_to_parse = obj_match.group(0)
        else:
            content_to_parse = content

        # Parse JSON response
        try:
            data = json.loads(content_to_parse)
            print(f"[DEBUG] JSON parsing successful, keys: {list(data.keys())}")
        except json.JSONDecodeError as e:
            print(f"[DEBUG] JSON parsing failed after sanitize: {e}")
            print(f"[DEBUG] Full content that failed: {repr(content_to_parse)}")
            return create_challenging_fallback_response(count)

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
            return create_challenging_fallback_response(count)

        print(f"[DEBUG] Extracted {len(quiz_items)} quiz items")
        
        # Additional shuffling of all but first question to ensure variety
        if len(quiz_items) > 1:
            first_item = quiz_items[0]
            rest = quiz_items[1:]
            random.shuffle(rest)
            quiz_items = [first_item] + rest
        
        # Normalize quiz items
        normalized_items = []
        seen_questions = set()  # Track to avoid duplicates
        
        for i, q in enumerate(quiz_items):
            try:
                # Force MCQ type and normalize
                q_id = q.get("id", f"ai_q_{i+1}")
                q_type = "mcq"
                question = q.get("question") or q.get("prompt", f"Question {i+1}")
                options = q.get("options", [])
                if not options or len(options) < 4:
                    print(f"[DEBUG] Question {i} missing options, skipping")
                    continue
                if len(options) > 4:
                    options = options[:4]
                while len(options) < 4:
                    options.append(f"Option {len(options)+1}")

                answer = q.get("answer", 0)
                if not isinstance(answer, int) or answer < 0 or answer >= 4:
                    answer = 0

                # Skip if question is too similar to a previous one
                question_key = question.lower().strip()[:50]
                if question_key in seen_questions:
                    print(f"[DEBUG] Skipping duplicate question: {question[:50]}...")
                    continue
                seen_questions.add(question_key)
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
            return create_challenging_fallback_response(count)
        
        final_items = normalized_items[:count]
        print(f"[DEBUG] Returning {len(final_items)} varied items, source: llm")
        print(f"[DEBUG] First question preview: {final_items[0].question[:100]}...")
        
        return BackendQuizResponse(
            items=final_items,
            source="llm",
            metadata={
                "model": model,
                "temperature": 0.95,
                "timestamp": int(time.time()),
                "difficulty": "challenging",
                "start_pattern": random_start,
                "session": uuid.uuid4().hex[:8]
            }
        )

    except Exception as e:
        print(f"[DEBUG] OpenAI request failed: {e}")
        print(f"[DEBUG] Full traceback: {traceback.format_exc()}")
        return create_challenging_fallback_response(count)

def create_challenging_fallback_response(count: int) -> BackendQuizResponse:
    """Create challenging fallback questions for when API fails"""
    print(f"[DEBUG] Creating challenging fallback response")
    
    challenging_questions = [
        QuizItem(
            id="fallback_1",
            type="mcq",
            question="Which sentence demonstrates correct use of the subjunctive mood?",
            options=[
                "If I was rich, I would travel the world.",
                "If I were rich, I would travel the world.",
                "If I am rich, I would travel the world.",
                "If I will be rich, I would travel the world."
            ],
            answer=1,
            explanation="The subjunctive mood uses 'were' instead of 'was' for hypothetical situations, regardless of the subject."
        ),
        QuizItem(
            id="fallback_2",
            type="mcq",
            question="Identify the type of figurative language: 'The homework was a mountain of impossibility.'",
            options=["Simile", "Metaphor", "Personification", "Hyperbole"],
            answer=1,
            explanation="This is a metaphor - it directly compares homework to a mountain without using 'like' or 'as'."
        ),
        QuizItem(
            id="fallback_3",
            type="mcq",
            question="Which sentence contains a dangling modifier?",
            options=[
                "Running quickly, John caught the bus.",
                "Walking through the park, the flowers were beautiful.",
                "After studying hard, she passed the exam.",
                "While eating dinner, we watched TV."
            ],
            answer=1,
            explanation="'Walking through the park' appears to modify 'flowers', but flowers can't walk - this is a dangling modifier."
        ),
        QuizItem(
            id="fallback_4",
            type="mcq",
            question="Choose the word that best completes the analogy: Doctor : Hospital :: Teacher : ?",
            options=["Student", "Classroom", "Book", "Learning"],
            answer=1,
            explanation="A doctor works in a hospital, just as a teacher works in a classroom. This is a place relationship analogy."
        ),
        QuizItem(
            id="fallback_5",
            type="mcq",
            question="Which sentence uses parallel structure correctly?",
            options=[
                "She likes reading, to swim, and biking.",
                "She likes reading, swimming, and biking.",
                "She likes to read, swimming, and to bike.",
                "She likes read, swim, and biking."
            ],
            answer=1,
            explanation="Parallel structure requires all items in a list to have the same grammatical form: reading, swimming, biking (all gerunds)."
        ),
        QuizItem(
            id="fallback_6",
            type="mcq",
            question="What is the effect of using passive voice in this sentence: 'Mistakes were made'?",
            options=[
                "It emphasizes who made the mistakes",
                "It obscures who is responsible for the mistakes",
                "It makes the sentence more direct",
                "It shortens the sentence"
            ],
            answer=1,
            explanation="Passive voice hides the agent (who made the mistakes), often used to avoid assigning blame or responsibility."
        ),
        QuizItem(
            id="fallback_7",
            type="fitb",
            question="Complete with the correct word: 'The committee ____ unable to reach a consensus.' (was/were)",
            options=["was", "were"],
            answer="was",
            explanation="'Committee' is a collective noun that is typically treated as singular in American English, so 'was' is correct."
        ),
        QuizItem(
            id="fallback_8",
            type="mcq",
            question="Which transition word indicates a contrasting relationship?",
            options=["Furthermore", "Nevertheless", "Similarly", "Therefore"],
            answer=1,
            explanation="'Nevertheless' indicates contrast or opposition, similar to 'however' or 'despite this'."
        )
    ]
    
    # Shuffle to ensure variety even in fallback
    random.shuffle(challenging_questions)
    
    return BackendQuizResponse(
        items=challenging_questions[:count],
        source="fallback (challenging)"
    )

def create_fallback_response(count: int, error_reason: str) -> BackendQuizResponse:
    """Redirect to challenging fallback"""
    return create_challenging_fallback_response(count)