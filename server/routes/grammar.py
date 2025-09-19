from fastapi import APIRouter
from pydantic import BaseModel
from difflib import ndiff
import os
from openai import OpenAI
import re
import base64
import json
from typing import Dict, List, Tuple

router = APIRouter(prefix="/api/grammar", tags=["grammar"])
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class EvalRequest(BaseModel):
    text: str
    image_id: str | None = None
    image_url: str | None = None  # New field for direct image analysis
    mode: str | None = "minimal"   # "minimal" | "fluency"
    dialect: str | None = "en-GB"  # or "en-US"
    grade_level: int | None = 6

def encode_image_from_url(image_url: str) -> str:
    """Convert image URL to base64 for OpenAI API"""
    import requests
    try:
        response = requests.get(image_url)
        response.raise_for_status()
        return base64.b64encode(response.content).decode('utf-8')
    except Exception as e:
        print(f"Error encoding image: {e}")
        return ""

def validate_with_vision(student_text: str, image_url: str, grade_level: int = 6) -> Tuple[int, List[str], bool, List[str]]:
    """
    Use GPT-4o vision to validate student description against actual image
    Returns: (context_score, hints, context_passed, feedback_parts)
    """
    try:
        # Encode image
        base64_image = encode_image_from_url(image_url)
        if not base64_image:
            return 100, [], True, ["Could not analyze image - using text only validation"]
        
        # Simplified prompt that asks for structured but not JSON response
        system_prompt = f"""You are an educational AI helping Grade {grade_level} students describe images accurately. 

Analyze the student's description and provide feedback in this exact format:

CONTEXT_SCORE: [number 0-100]
CONTEXT_PASSED: [true/false]
ACCURATE_ELEMENTS: [comma-separated list or "none"]
INACCURATE_ELEMENTS: [comma-separated list or "none"]
MISSING_ELEMENTS: [comma-separated list or "none"]
FEEDBACK: [2-3 sentences of educational feedback]

Be encouraging but accurate. Point out specific inaccuracies clearly."""

        user_prompt = f"""Student wrote: "{student_text}"

Please analyze this description of the image and respond in the exact format requested."""

        # Call GPT-4o vision
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user", 
                    "content": [
                        {"type": "text", "text": user_prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}",
                                "detail": "high"
                            }
                        }
                    ]
                }
            ],
            temperature=0.3,
            max_tokens=800
        )
        
        # Parse structured response
        content = response.choices[0].message.content
        print(f"Vision API Response: {content}")  # Debug log
        
        # Extract information using regex
        context_score = 80  # default
        context_passed = True  # default
        accurate_elements = []
        inaccurate_elements = []
        missing_elements = []
        feedback_text = "Analysis completed."
        
        # Parse the response
        if "CONTEXT_SCORE:" in content:
            score_match = re.search(r"CONTEXT_SCORE:\s*(\d+)", content)
            if score_match:
                context_score = int(score_match.group(1))
        
        if "CONTEXT_PASSED:" in content:
            passed_match = re.search(r"CONTEXT_PASSED:\s*(true|false)", content, re.IGNORECASE)
            if passed_match:
                context_passed = passed_match.group(1).lower() == "true"
        
        if "ACCURATE_ELEMENTS:" in content:
            acc_match = re.search(r"ACCURATE_ELEMENTS:\s*([^\n]+)", content)
            if acc_match and acc_match.group(1).strip().lower() != "none":
                accurate_elements = [x.strip() for x in acc_match.group(1).split(",")]
        
        if "INACCURATE_ELEMENTS:" in content:
            inacc_match = re.search(r"INACCURATE_ELEMENTS:\s*([^\n]+)", content)
            if inacc_match and inacc_match.group(1).strip().lower() != "none":
                inaccurate_elements = [x.strip() for x in inacc_match.group(1).split(",")]
        
        if "MISSING_ELEMENTS:" in content:
            miss_match = re.search(r"MISSING_ELEMENTS:\s*([^\n]+)", content)
            if miss_match and miss_match.group(1).strip().lower() != "none":
                missing_elements = [x.strip() for x in miss_match.group(1).split(",")]
        
        if "FEEDBACK:" in content:
            feedback_match = re.search(r"FEEDBACK:\s*(.+)", content, re.DOTALL)
            if feedback_match:
                feedback_text = feedback_match.group(1).strip()
        
        # Build hints and feedback
        hints = []
        feedback_parts = []
        
        # Add accurate elements feedback
        if accurate_elements:
            feedback_parts.append(f"✓ You correctly mentioned: {', '.join(accurate_elements)}")
        
        # Add inaccurate elements feedback with specific corrections
        if inaccurate_elements:
            for item in inaccurate_elements:
                hints.append(f"Correction needed: {item}")
                feedback_parts.append(f"⚠ Inaccurate: {item}")
        
        # Add missing elements feedback
        if missing_elements:
            for item in missing_elements:
                hints.append(f"Consider adding: {item}")
                feedback_parts.append(f"💡 Could mention: {item}")
        
        # Add general feedback
        feedback_parts.append(f"Overall: {feedback_text}")
        
        return context_score, hints, context_passed, feedback_parts
        
    except Exception as e:
        print(f"Vision API error: {e}")
        # Fallback to neutral score with error message
        return 60, [f"Vision analysis failed: {str(e)}"], False, [f"Could not analyze image: {str(e)}"]

# Keep all existing helper functions...
def lemmatize_word(word: str) -> str:
    """Simple lemmatization - remove common suffixes"""
    word = word.lower().strip()
    suffixes = ['ing', 'ed', 's', 'es', 'ly', 'er', 'est']
    for suffix in suffixes:
        if word.endswith(suffix) and len(word) > len(suffix) + 2:
            word = word[:-len(suffix)]
    return word

def get_synonyms(word: str) -> List[str]:
    """Get all synonyms for a word including the word itself"""
    word = word.lower().strip()
    synonyms = [word]
    
    # Simple synonym mapping (you can expand this)
    SYNONYM_MAP = {
        "dog": ["puppy", "canine", "pet"],
        "cat": ["kitten", "feline", "pet"],
        "teacher": ["instructor", "educator", "professor"],
        "student": ["pupil", "learner"],
        "man": ["person", "male", "guy"],
        "woman": ["person", "female", "lady"],
        "writing": ["writing", "drawing", "marking"],
        "board": ["blackboard", "whiteboard", "chalkboard"],
        "sweater": ["jumper", "pullover", "cardigan"],
        "shirt": ["top", "blouse", "clothing"]
    }
    
    for key, values in SYNONYM_MAP.items():
        if word == key or word in values:
            synonyms.extend([key] + values)
            break
    
    return list(set(synonyms))

def validate_context(student_text: str, image_metadata: Dict) -> Tuple[int, List[str], bool]:
    """Original metadata-based validation (kept as fallback)"""
    if not image_metadata:
        return 100, [], True
    
    objects = list(image_metadata.get("objects", []))
    actions = list(image_metadata.get("actions", []))
    locations = list(image_metadata.get("locations", []))
    
    # Basic validation logic
    words = re.findall(r'\b\w+\b', student_text.lower())
    lemmatized_words = [lemmatize_word(word) for word in words]
    
    object_matches = sum(1 for obj in objects if any(word in get_synonyms(obj) for word in lemmatized_words))
    action_matches = sum(1 for action in actions if any(word in get_synonyms(action) for word in lemmatized_words))
    location_matches = sum(1 for location in locations if any(word in get_synonyms(location) for word in lemmatized_words))
    
    context_score = min(100, (object_matches * 40) + (action_matches * 30) + (location_matches * 20) + 10)
    context_passed = object_matches > 0 or action_matches > 0
    hints = []
    
    if not context_passed:
        if objects:
            hints.append(f"Try mentioning the main subject: {objects[0]}")
        if actions:
            hints.append(f"Describe what's happening: {actions[0]}")
    
    return context_score, hints, context_passed

def score_and_tags(orig: str, corrected: str):
    """Score grammar corrections by comparing original vs corrected text"""
    tags = {"SVA":0,"Article":0,"Spelling":0,"Punctuation":0,"Tense":0,"WordChoice":0}
    penalties = 0
    
    # Split into words for comparison
    orig_words = orig.lower().split()
    corrected_words = corrected.lower().split()
    
    # Check for spelling errors by comparing word-by-word
    for i, (orig_word, corr_word) in enumerate(zip(orig_words, corrected_words)):
        if orig_word != corr_word:
            # Determine error type based on the difference
            if len(orig_word) == len(corr_word):
                # Same length, likely spelling error
                tags["Spelling"] += 1
                penalties += 10
            elif orig_word in corr_word or corr_word in orig_word:
                # One contains the other, likely missing/extra letters
                tags["Spelling"] += 1
                penalties += 8
            else:
                # Different words entirely, likely word choice
                tags["WordChoice"] += 1
                penalties += 12
    
    # Check for extra/missing words
    if len(orig_words) != len(corrected_words):
        if len(corrected_words) > len(orig_words):
            # Words were added
            tags["WordChoice"] += 1
            penalties += 8
        else:
            # Words were removed
            tags["WordChoice"] += 1
            penalties += 6
    
    # Check capitalization
    if orig and orig[0].islower(): 
        tags["Punctuation"] += 1
        penalties += 5
    
    # Check ending punctuation
    if not orig.strip().endswith((".", "!", "?")):
        tags["Punctuation"] += 1
        penalties += 5
    
    # Calculate final score
    score = max(0, 100 - penalties)
    return score, tags

def semantic_consistency_checks(text: str) -> Tuple[List[str], int]:
    """Check for basic semantic issues"""
    warnings = []
    penalty = 0
    
    t = text.lower()
    
    # Check for pronoun-noun mismatches
    if any(word in t for word in ["he", "him", "his"]) and any(word in t for word in ["woman", "girl", "lady"]):
        warnings.append("Pronoun-noun mismatch: masculine pronoun with female noun (consider 'She is a woman' or 'He is a man')")
        penalty += 15
    
    if any(word in t for word in ["she", "her", "hers"]) and any(word in t for word in ["man", "boy", "gentleman"]):
        warnings.append("Pronoun-noun mismatch: feminine pronoun with male noun (consider 'She is a woman' or 'He is a man')")
        penalty += 15
    
    return warnings, penalty

@router.post("/evaluate")
def evaluate(req: EvalRequest):
    # Stage A: Grammar Correction
    system = (
        "You correct English sentences for Grade 6. "
        f"Use {req.dialect} spelling. "
        "When mode='minimal', make the smallest edits that fix grammar/punctuation AND obvious semantic errors. "
        "For pronoun-noun mismatches (like 'She is a man'), suggest the most logical correction (either 'She is a woman' or 'He is a man'). "
        "Keep the student's voice but prioritize logical meaning. "
        "Only correct clear grammatical errors and obvious semantic inconsistencies."
    )
    user = f"Original: {req.text}\nMode: {req.mode}\nGrade: {req.grade_level}\nReturn only the corrected sentence."
    
    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role":"system", "content":system},
                      {"role":"user", "content":user}],
            temperature=0
        )
        corrected = resp.choices[0].message.content.strip()
    except Exception as e:
        print(f"Grammar correction failed: {e}")
        corrected = req.text  # Use original if correction fails
    
    # Calculate grammar score
    grammar_score, tags = score_and_tags(req.text, corrected)
    
    # Semantic consistency checks
    sem_warnings, sem_penalty = semantic_consistency_checks(corrected)
    if sem_warnings:
        try:
            tags["Semantics"] = tags.get("Semantics", 0) + len(sem_warnings)
        except Exception:
            pass
    
    # Stage B: Context Validation
    context_score = 100
    context_hints = []
    context_passed = True
    context_feedback = []
    final_score = grammar_score
    
    if req.image_url:
        # Use GPT-4o vision for direct image analysis
        try:
            context_score, context_hints, context_passed, context_feedback = validate_with_vision(
                corrected, req.image_url, req.grade_level
            )
        except Exception as e:
            context_score = 70
            context_passed = False
            context_feedback = [f"Vision analysis failed: {str(e)}"]
            context_hints = ["Could not analyze image - please check your description manually"]
        
        # Calculate final score with new weighting: 40% grammar, 60% context
        final_score = int(grammar_score * 0.4 + context_score * 0.6)
    
    elif req.image_id:
        # Fallback to metadata-based validation
        try:
            from .images import IMAGES
            image_metadata = None
            for img in IMAGES:
                if img["id"] == req.image_id:
                    image_metadata = img
                    break
            
            if image_metadata:
                context_score, context_hints, context_passed = validate_context(corrected, image_metadata)
                context_feedback = [f"Metadata-based validation: {context_score}%"]
                
                # Calculate final score with new weighting: 40% grammar, 60% context
                final_score = int(grammar_score * 0.4 + context_score * 0.6)
        except Exception as e:
            print(f"Metadata validation failed: {e}")
    
    # Apply semantic penalty
    if sem_penalty:
        final_score = max(0, final_score - sem_penalty)
    
    # Create combined corrected version that includes context fixes
    combined_corrected = corrected
    if req.image_url and context_feedback:
        # Try to create a more complete corrected version based on context feedback
        try:
            # Use AI to create a combined correction that includes context fixes
            context_prompt = f"""
            Original sentence: "{req.text}"
            Grammar-corrected sentence: "{corrected}"
            Context feedback: {context_feedback}
            
            Create a final corrected sentence that combines both grammar corrections AND context corrections.
            For example, if the original says "boy" but it should be "girl", change it to "girl".
            If it says "using pens" but should be "using a paintbrush", change it to "using a paintbrush".
            Keep the grammar corrections but also apply the context corrections.
            
            Return ONLY the final corrected sentence, nothing else.
            """
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": context_prompt}],
                max_tokens=100,
                temperature=0.1
            )
            
            combined_corrected = response.choices[0].message.content.strip().strip('"')
            
        except Exception as e:
            # Fallback to grammar-corrected version if context correction fails
            combined_corrected = corrected

    # Generate diff using the combined corrected version
    try:
        diff_list = list(ndiff(req.text.split(), combined_corrected.split()))
        diff = [{"op":"replace" if x.startswith(('-','+')) else "equal","token":x[2:]} for x in diff_list]
    except:
        diff = []
    
    explanations = context_hints + sem_warnings
    all_feedback = explanations + context_feedback
    
    return {
        "corrected": combined_corrected,  # Use combined corrected version
        "grammar_corrected": corrected,   # Keep original grammar correction for reference
        "diff": diff, 
        "explanations": all_feedback,
        "context_feedback": context_feedback,
        "score": final_score, 
        "tags": tags, 
        "confidence": "high" if req.image_url else "medium",
        "context_score": context_score,
        "context_passed": context_passed,
        "grammar_score": grammar_score
    }