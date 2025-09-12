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
    configured = os.getenv("MODEL_NAME", "gpt-5")
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
        
        # ENHANCED system prompt for AGE-APPROPRIATE questions (MCQ ONLY)
        system_prompt = (
            "You are a PSAC Grade 6 English quiz generator for 11-year-old students in Mauritius. "
            "Generate CLEAR, AGE-APPROPRIATE questions that are educational but not confusing. "
            "\n\nCRITICAL REQUIREMENTS FOR 11-YEAR-OLDS:\n"
            "1. Use SIMPLE, CLEAR vocabulary - avoid complex words like 'sophisticated', 'elaborate', 'comprehensive', 'intricate'\n"
            "2. Make questions UNAMBIGUOUS - only ONE answer should be clearly correct\n"
            "3. For True/False questions: ONLY use 'True' and 'False' options (exactly 2 options, never 'somewhat true', 'always false', 'not sure', 'maybe', etc.)\n"
            "4. Avoid questions where multiple answers could be considered correct\n"
            "5. Use everyday language that 11-year-olds understand\n"
            "6. ENSURE ALL OPTIONS ARE DISTINCT - avoid similar/overlapping options (e.g., don't use both 'quietly' and 'silently' as they mean the same thing)\n"
            "7. ENSURE ALL ANSWERS ARE FACTUALLY CORRECT - double-check grammar rules, spelling, and facts\n"
            "8. For grammar questions, make sure the 'correct' answer is actually correct and the 'incorrect' options have real errors\n"
            "\n\nFORMAT REQUIREMENT:\n"
            "ALL questions MUST be in MULTIPLE CHOICE format with EXACTLY 4 options.\n"
            "For True/False questions, use: ['True', 'False'] (exactly 2 options only)\n"
            "NEVER generate open-ended, analysis, or essay questions.\n"
            "ALWAYS provide 4 clickable options (A, B, C, D) for EVERY question.\n"
            "\n\nEXAMPLES OF GOOD QUESTIONS:\n"
            "- 'Which word means the same as 'happy'?' + 4 simple options\n"
            "- 'What is the main idea of this sentence?' + 4 clear options\n"
            "- 'Which sentence is written correctly?' + 4 options with obvious errors\n"
            "\n\nEXAMPLES OF BAD QUESTIONS (DO NOT USE):\n"
            "- 'Which sentence is a more sophisticated transformation...' (too complex)\n"
            "- Questions where multiple answers could be right\n"
            "- True/False with options like 'somewhat true', 'always false'\n"
            "- Using words like 'sophisticated', 'elaborate', 'comprehensive'\n"
            "- Options that are too similar: ['quietly', 'silently', 'softly', 'peacefully'] (quietly/silently mean the same)\n"
            "- Overlapping synonyms: ['happy', 'joyful', 'glad', 'cheerful'] (too similar meanings)\n"
            "\n\nReturn ONLY valid JSON in this exact format:\n"
            '{"items": [{"id": "q1", "type": "mcq", '
            '"question": "Simple, clear question for 11-year-olds?", '
            '"options": ["Option A", "Option B", "Option C", "Option D"], '
            '"answer": 0, "explanation": "Simple explanation"}]}'
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
            f"Generate EXACTLY {count} MULTIPLE CHOICE questions (MCQ only!) for 11-YEAR-OLD Grade 6 English students. "
            f"Topic: {query_text}. Skills: {', '.join(skills)}. "
            f"\n\nCRITICAL REQUIREMENTS FOR 11-YEAR-OLDS:\n"
            f"1. Use SIMPLE vocabulary - NO complex words like 'sophisticated', 'elaborate', 'comprehensive'\n"
            f"2. Make questions UNAMBIGUOUS - only ONE answer should be clearly correct\n"
            f"3. For True/False: ONLY use 'True' and 'False' (exactly 2 options, never 'somewhat true', 'always false', 'not sure', 'maybe')\n"
            f"4. Avoid questions where multiple answers could be right\n"
            f"5. Use everyday language that 11-year-olds understand\n"
            f"6. ENSURE ALL OPTIONS ARE DISTINCT - avoid similar/overlapping options (e.g., don't use both 'quietly' and 'silently')\n"
            f"7. ENSURE ALL ANSWERS ARE FACTUALLY CORRECT - double-check grammar rules and facts\n"
            f"8. For grammar questions, make sure the 'correct' answer is actually correct\n"
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
            f"AVOID complex vocabulary and ambiguous questions.\n"
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
                if not options:
                    print(f"[DEBUG] Question {i} has no options, skipping")
                    continue
                
                # Clean and validate options
                print(f"[DEBUG] Question {i} raw options: {options}")
                options = [str(opt).strip() for opt in options if str(opt).strip()]
                print(f"[DEBUG] Question {i} cleaned options: {options}")
                
                # Check if this is a True/False question
                is_true_false = (
                    "true or false" in question.lower() or 
                    "true/false" in question.lower() or
                    any(opt.lower() in ["true", "false"] for opt in options)
                )
                
                if is_true_false:
                    # For True/False questions, ensure we have exactly 2 options
                    print(f"[DEBUG] Question {i} is True/False, ensuring 2 options")
                    if len(options) < 2:
                        # Add missing True/False options
                        if not any(opt.lower() == "true" for opt in options):
                            options.append("True")
                        if not any(opt.lower() == "false" for opt in options):
                            options.append("False")
                    elif len(options) > 2:
                        # Keep only True and False if present, otherwise take first 2
                        true_false_options = [opt for opt in options if opt.lower() in ["true", "false"]]
                        if len(true_false_options) >= 2:
                            options = true_false_options[:2]
                        else:
                            options = options[:2]
                else:
                    # For regular questions, ensure we have exactly 4 options
                    if len(options) < 4:
                        print(f"[DEBUG] Question {i} has only {len(options)} options, padding to 4")
                        # Pad with generic options if needed
                        while len(options) < 4:
                            options.append(f"Option {len(options)+1}")
                    elif len(options) > 4:
                        options = options[:4]
                
                print(f"[DEBUG] Question {i} final options: {options}")

                answer = q.get("answer", 0)
                # Validate answer index based on number of options
                max_answer_index = len(options) - 1
                if not isinstance(answer, int) or answer < 0 or answer > max_answer_index:
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
    """Create age-appropriate fallback questions for when API fails"""
    print(f"[DEBUG] Creating age-appropriate fallback response")
    
    age_appropriate_questions = [
        QuizItem(
            id="fallback_1",
            type="mcq",
            question="Which sentence is written correctly?",
            options=[
                "She goed to school yesterday.",
                "She went to school yesterday.",
                "She go to school yesterday.",
                "She going to school yesterday."
            ],
            answer=1,
            explanation="'Went' is the correct past tense of 'go'."
        ),
        QuizItem(
            id="fallback_2",
            type="mcq",
            question="What type of word is 'quickly' in this sentence: 'She ran quickly'?",
            options=["Noun", "Verb", "Adjective", "Adverb"],
            answer=3,
            explanation="'Quickly' describes how she ran, so it's an adverb."
        ),
        QuizItem(
            id="fallback_3",
            type="mcq",
            question="Which word means the same as 'happy'?",
            options=["Sad", "Angry", "Joyful", "Tired"],
            answer=2,
            explanation="'Joyful' means the same as 'happy' - both describe a positive feeling."
        ),
        QuizItem(
            id="fallback_4",
            type="mcq",
            question="Choose the correct sentence:",
            options=[
                "The cat are sleeping.",
                "The cat is sleeping.",
                "The cat am sleeping.",
                "The cat be sleeping."
            ],
            answer=1,
            explanation="'The cat' is singular, so we use 'is' not 'are'."
        ),
        QuizItem(
            id="fallback_5",
            type="mcq",
            question="Which sentence has the correct punctuation?",
            options=[
                "Hello how are you",
                "Hello, how are you?",
                "Hello how are you?",
                "Hello, how are you"
            ],
            answer=1,
            explanation="We need a comma after 'Hello' and a question mark at the end."
        ),
        QuizItem(
            id="fallback_6",
            type="mcq",
            question="What is the main idea of this sentence: 'The sun shines brightly in the sky'?",
            options=[
                "The sky is blue",
                "The sun is bright",
                "It's daytime",
                "The weather is good"
            ],
            answer=1,
            explanation="The sentence is mainly about the sun being bright."
        ),
        QuizItem(
            id="fallback_7",
            type="mcq",
            question="Which word is a noun?",
            options=["Run", "Beautiful", "House", "Quickly"],
            answer=2,
            explanation="'House' is a noun - it's a thing you can see and touch."
        ),
        QuizItem(
            id="fallback_8",
            type="mcq",
            question="True or False: 'I have went to the store' is correct grammar.",
            options=["True", "False"],
            answer=1,
            explanation="This is false. It should be 'I have gone to the store' or 'I went to the store'."
        )
    ]
    
    # Shuffle to ensure variety even in fallback
    random.shuffle(age_appropriate_questions)
    
    return BackendQuizResponse(
        items=age_appropriate_questions[:count],
        source="fallback (age-appropriate)"
    )

def create_fallback_response(count: int, error_reason: str) -> BackendQuizResponse:
    """Redirect to challenging fallback"""
    return create_challenging_fallback_response(count)