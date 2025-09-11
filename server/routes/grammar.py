from fastapi import APIRouter
from pydantic import BaseModel
from difflib import ndiff
import os
from openai import OpenAI
import re
from typing import Dict, List, Tuple

router = APIRouter(prefix="/api/grammar", tags=["grammar"])
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class EvalRequest(BaseModel):
    text: str
    image_id: str | None = None
    mode: str | None = "minimal"   # "minimal" | "fluency"
    dialect: str | None = "en-GB"  # or "en-US"
    grade_level: int | None = 6

# Synonym mappings for context validation
SYNONYM_MAP = {
    # Objects
    "dog": ["puppy", "canine", "pet"],
    "cat": ["kitten", "feline", "pet"],
    "boy": ["kid", "child", "youngster", "lad"],
    "girl": ["kid", "child", "youngster", "lass"],
    "children": ["kids", "boys", "girls", "youngsters"],
    "ball": ["sphere", "toy"],
    "book": ["textbook", "novel", "reading material"],
    "car": ["vehicle", "automobile", "auto"],
    "tree": ["plant", "sapling"],
    "flower": ["bloom", "blossom", "petal"],
    "house": ["home", "building", "residence"],
    "school": ["classroom", "building", "education"],
    "park": ["playground", "garden", "outdoor area"],
    "beach": ["shore", "coast", "sand"],
    "mountain": ["peak", "hill", "cliff"],
    "ocean": ["sea", "water", "waves"],
    
    # Actions
    "play": ["playing", "plays", "played", "game"],
    "run": ["running", "runs", "ran", "jog"],
    "walk": ["walking", "walks", "walked", "stroll"],
    "eat": ["eating", "eats", "ate", "dining"],
    "sleep": ["sleeping", "sleeps", "slept", "resting"],
    "read": ["reading", "reads", "studying"],
    "cook": ["cooking", "cooks", "preparing"],
    "drive": ["driving", "drives", "drove", "traveling"],
    "swim": ["swimming", "swims", "swam"],
    "jump": ["jumping", "jumps", "jumped", "leap"],
    "sit": ["sitting", "sits", "sat", "seated"],
    "stand": ["standing", "stands", "stood"],
    "hold": ["holding", "holds", "held", "carrying"],
    "feed": ["feeding", "feeds", "fed", "giving"],
    
    # Locations
    "home": ["house", "residence", "indoors"],
    "outside": ["outdoors", "exterior", "open air"],
    "inside": ["indoors", "interior", "within"],
    "street": ["road", "avenue", "urban"],
    "city": ["urban", "town", "metropolitan"],
    "garden": ["yard", "outdoor area", "plants"],
    "kitchen": ["cooking area", "food preparation"],
    "classroom": ["school", "learning area", "education"],
    "library": ["reading room", "book area", "study"],
    "forest": ["woods", "trees", "nature"],
    "field": ["meadow", "grassland", "open area"],
}

def lemmatize_word(word: str) -> str:
    """Simple lemmatization - remove common suffixes"""
    word = word.lower().strip()
    
    # Remove common suffixes
    suffixes = ['ing', 'ed', 's', 'es', 'ly', 'er', 'est']
    for suffix in suffixes:
        if word.endswith(suffix) and len(word) > len(suffix) + 2:
            word = word[:-len(suffix)]
    
    return word

def get_synonyms(word: str) -> List[str]:
    """Get all synonyms for a word including the word itself"""
    word = word.lower().strip()
    synonyms = [word]
    
    # Check if word is a key in synonym map
    for key, values in SYNONYM_MAP.items():
        if word == key or word in values:
            synonyms.extend([key] + values)
            break
    
    return list(set(synonyms))  # Remove duplicates

def validate_context(student_text: str, image_metadata: Dict) -> Tuple[int, List[str], bool]:
    """
    Validate if student text matches image context
    Returns: (context_score, hints, context_passed)
    """
    if not image_metadata:
        return 100, [], True
    
    # Extract metadata
    objects = list(image_metadata.get("objects", []))
    actions = list(image_metadata.get("actions", []))
    locations = list(image_metadata.get("locations", []))

    # Expand metadata from title/alt as a fallback (helps when lists are incomplete)
    title_alt = f"{image_metadata.get('title','')} {image_metadata.get('alt','')}"
    meta_words = re.findall(r"\b\w+\b", title_alt.lower())

    action_keys = {
        "play","run","walk","eat","sleep","read","cook","drive","swim","jump","sit","stand","hold","feed"
    }
    location_keys = {
        "home","outside","inside","street","city","garden","kitchen","classroom","library","forest","field","beach","park","room","windowsill","chair"
    }

    for w in meta_words:
        base = lemmatize_word(w)
        if base in action_keys and base not in actions:
            actions.append(base)
        elif base in location_keys and base not in locations:
            locations.append(base)
        else:
            if base not in objects and base not in action_keys and base not in location_keys and len(base) > 2:
                objects.append(base)
    
    # Clean and lemmatize student text
    words = re.findall(r'\b\w+\b', student_text.lower())
    lemmatized_words = [lemmatize_word(word) for word in words]
    
    # Check matches
    object_matches = 0
    action_matches = 0
    location_matches = 0
    
    # Check objects (give credit for any one relevant object)
    for obj in objects:
        obj_synonyms = get_synonyms(obj)
        if any(word in obj_synonyms for word in lemmatized_words):
            object_matches += 1
            break
    
    # Check actions (sleeping/sleep etc.)
    for action in actions:
        action_synonyms = get_synonyms(action)
        if any(word in action_synonyms for word in lemmatized_words):
            action_matches += 1
            break
    
    # Check locations (credit if any location term appears)
    for location in locations:
        location_synonyms = get_synonyms(location)
        if any(word in location_synonyms for word in lemmatized_words):
            location_matches += 1
            break
    
    # Calculate context score
    # Score with softer thresholds; object OR action should be enough to pass
    # Also reward close synonyms more than locations
    context_score = 0
    if object_matches > 0:
        context_score += 70
    if action_matches > 0:
        context_score += 25
    if location_matches > 0:
        context_score += 5
    
    # Generate hints
    hints = []
    if object_matches == 0 and objects:
        hints.append(f"Your sentence doesn't mention the main subject I see. Try including it. (Hint: {objects[0]})")
    if action_matches == 0 and actions:
        hints.append(f"Try describing what's happening. (Hint: {actions[0]})")
    if location_matches == 0 and locations:
        hints.append(f"Consider mentioning where this is taking place. (Hint: {locations[0]})")
    
    # Context passes if object OR action is present
    context_passed = (object_matches > 0) or (action_matches > 0)
    
    return context_score, hints, context_passed

def score_and_tags(orig: str, corrected: str):
    # toy scoring just to unblock you
    tags = {"SVA":0,"Article":0,"Spelling":0,"Punctuation":0,"Tense":0,"WordChoice":0}
    penalties = 0
    if orig and orig[0].islower(): tags["Punctuation"] += 1; penalties += 5
    if not orig.strip().endswith((".", "!", "?")): tags["Punctuation"] += 1; penalties += 5
    score = max(0, 100 - penalties)
    return score, tags

def semantic_consistency_checks(text: str) -> Tuple[List[str], int]:
    """Return warnings and a suggested penalty (0-30) for meaning issues.
    Currently checks simple pronoun–gendered-noun mismatches.
    """
    t = (text or "").lower()
    warnings: List[str] = []

    def contains_any(words: List[str]) -> bool:
        return any(re.search(rf"\b{re.escape(w)}\b", t) for w in words)

    masc_pronouns = ["he", "him", "his"]
    fem_pronouns = ["she", "her", "hers"]

    male_nouns = [
        "man","boy","father","brother","uncle","king","actor","waiter","policeman","businessman","gentleman","husband","son"
    ]
    female_nouns = [
        "woman","girl","mother","sister","aunt","queen","actress","waitress","policewoman","businesswoman","lady","wife","daughter"
    ]

    penalty = 0
    if contains_any(fem_pronouns) and contains_any(male_nouns):
        warnings.append("Pronoun–noun mismatch: feminine pronoun with a male noun (meaning issue).")
        penalty += 20
    if contains_any(masc_pronouns) and contains_any(female_nouns):
        warnings.append("Pronoun–noun mismatch: masculine pronoun with a female noun (meaning issue).")
        penalty += 20

    # Cap penalty to avoid overpowering grammar score
    penalty = min(penalty, 30)
    return warnings, penalty

@router.post("/evaluate")
def evaluate(req: EvalRequest):
    # Stage A: Grammar Correction
    system = (
        "You correct English sentences for Grade 6. "
        f"Use {req.dialect} spelling. "
        "When mode='minimal', make the smallest edits that fix grammar/punctuation. "
        "Keep the student's voice."
    )
    user = f"Original: {req.text}\nMode: {req.mode}\nGrade: {req.grade_level}\nReturn only the corrected sentence."
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role":"system", "content":system},
                  {"role":"user", "content":user}],
        temperature=0
    )
    corrected = resp.choices[0].message.content.strip()
    
    # Calculate grammar score (initial, before any semantic rewrite)
    grammar_score, tags = score_and_tags(req.text, corrected)

    # Stage A2: Semantic consistency (affects score regardless of image context)
    sem_warnings, sem_penalty = semantic_consistency_checks(corrected)
    if sem_warnings:
        # augment tags and apply penalty later to final score
        try:
            tags["Semantics"] = tags.get("Semantics", 0) + len(sem_warnings)  # type: ignore
        except Exception:
            pass
    
    # Optional: rewrite gendered nouns to match pronouns
    def _preserve_case(src: str, dst: str) -> str:
        return dst.capitalize() if src[:1].isupper() else dst

    MALE_TO_FEMALE = {
        "man": "woman",
        "boy": "girl",
        "father": "mother",
        "brother": "sister",
        "uncle": "aunt",
        "king": "queen",
        "actor": "actress",
        "waiter": "waitress",
        "policeman": "policewoman",
        "businessman": "businesswoman",
        "gentleman": "lady",
        "husband": "wife",
        "son": "daughter",
    }
    FEMALE_TO_MALE = {v: k for k, v in MALE_TO_FEMALE.items()}

    lower_txt = corrected.lower()
    has_fem_pronoun = any(re.search(rf"\b{p}\b", lower_txt) for p in ["she", "her", "hers"])
    has_masc_pronoun = any(re.search(rf"\b{p}\b", lower_txt) for p in ["he", "him", "his"])

    rewrite_note = None
    if has_fem_pronoun:
        for male, female in MALE_TO_FEMALE.items():
            if re.search(rf"\b{male}\b", lower_txt):
                corrected = re.sub(rf"\b{male}\b", lambda m: _preserve_case(m.group(0), female), corrected, flags=re.IGNORECASE)
                rewrite_note = f"Adjusted noun to match pronoun: {male} → {female}."
                sem_penalty = 0
                break
    elif has_masc_pronoun:
        for female, male in FEMALE_TO_MALE.items():
            if re.search(rf"\b{female}\b", lower_txt):
                corrected = re.sub(rf"\b{female}\b", lambda m: _preserve_case(m.group(0), male), corrected, flags=re.IGNORECASE)
                rewrite_note = f"Adjusted noun to match pronoun: {female} → {male}."
                sem_penalty = 0
                break
    
    # Stage B: Context Validation (if image_id provided)
    context_score = 100
    context_hints = []
    context_passed = True
    final_score = grammar_score
    
    if req.image_id:
        # Get image metadata from the images list
        from .images import IMAGES
        image_metadata = None
        for img in IMAGES:
            if img["id"] == req.image_id:
                image_metadata = img
                break
        
        if image_metadata:
            context_score, context_hints, context_passed = validate_context(corrected, image_metadata)
            
            # Adjust final score based on context
            if context_passed:
                # Weight: 70% grammar, 30% context
                final_score = int(grammar_score * 0.7 + context_score * 0.3)
            else:
                # Context failed - cap the score
                final_score = min(grammar_score, 80)  # Max 80 if context fails
    
    # Apply semantic penalty after combining with context
    if sem_penalty:
        final_score = max(0, final_score - sem_penalty)

    # Generate diff AFTER potential rewrite
    diff_list = list(ndiff(req.text.split(), corrected.split()))
    diff = [{"op":"replace" if x.startswith(('-','+')) else "equal","token":x[2:]} for x in diff_list]

    explanations = context_hints + sem_warnings  # Include semantic notes
    if rewrite_note:
        explanations.append(rewrite_note)
    
    return {
        "corrected": corrected, 
        "diff": diff, 
        "explanations": explanations,
        "score": final_score, 
        "tags": tags, 
        "confidence": "medium",
        "context_score": context_score,
        "context_passed": context_passed,
        "grammar_score": grammar_score
    }
