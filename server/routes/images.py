from fastapi import APIRouter, Query
from typing import List, Literal

router = APIRouter(prefix="/api/images", tags=["images"])

IMAGES = [
    {"id": "easy-01", "path": "/images/prompts/easy/img_1.png", "level": "easy", "title": "A dog playing fetch with a red ball", "alt": "A brown, white, and black dog running on green grass, holding a red ball in its mouth", "objects": ["dog", "ball", "grass"], "actions": ["running", "holding", "playing", "carrying"], "locations": ["park", "grass", "outdoors"]},
    {"id": "easy-02", "path": "/images/prompts/easy/img_2.png", "level": "easy", "title": "Children playing in a park", "alt": "Two children playing on playground equipment", "objects": ["children", "playground", "equipment"], "actions": ["play", "climb"], "locations": ["park", "playground"]},
    {"id": "easy-03", "path": "/images/prompts/easy/img_3.png", "level": "easy", "title": "A cat sleeping on a windowsill", "alt": "Orange cat sleeping peacefully on a windowsill", "objects": ["cat", "windowsill", "window"], "actions": ["sleep", "rest"], "locations": ["windowsill", "indoor"]},
    {"id": "easy-04", "path": "/images/prompts/easy/img_4.png", "level": "easy", "title": "A colorful garden with flowers", "alt": "Bright garden filled with colorful flowers and plants", "objects": ["flowers", "garden", "plants"], "actions": ["grow", "bloom"], "locations": ["garden", "outdoor"]},
    {"id": "easy-05", "path": "/images/prompts/easy/img_5.png", "level": "easy", "title": "A family having dinner together", "alt": "Family sitting around a table sharing a meal", "objects": ["family", "table", "food", "dinner"], "actions": ["eat", "sit", "share"], "locations": ["dining room", "home"]},
    {"id": "easy-06", "path": "/images/prompts/easy/img_6.png", "level": "easy", "title": "A dog running in a field", "alt": "Happy dog running through a green field", "objects": ["dog", "field", "grass"], "actions": ["run", "play"], "locations": ["field", "outdoor"]},
    {"id": "easy-07", "path": "/images/prompts/easy/img_7.png", "level": "easy", "title": "A sunny beach with waves", "alt": "Beautiful beach with blue ocean waves and sand", "objects": ["beach", "waves", "sand", "ocean"], "actions": ["wave", "flow"], "locations": ["beach", "ocean"]},
    {"id": "easy-08", "path": "/images/prompts/easy/img_8.png", "level": "easy", "title": "A cozy library with books", "alt": "Quiet library filled with books and reading spaces", "objects": ["books", "library", "furniture"], "actions": ["read", "study"], "locations": ["library", "indoor"]},
    {"id": "medium-01", "path": "/images/prompts/medium/img_1.png", "level": "medium", "title": "Girl feeding a dog", "alt": "Young girl feeding treats to a friendly dog", "objects": ["girl", "dog", "treats"], "actions": ["feed", "give"], "locations": ["home", "garden"]},
    {"id": "medium-02", "path": "/images/prompts/medium/img_2.png", "level": "medium", "title": "A busy city street", "alt": "Busy urban street with cars and buildings", "objects": ["cars", "buildings", "street", "traffic"], "actions": ["drive", "walk", "move"], "locations": ["city", "street"]},
    {"id": "medium-03", "path": "/images/prompts/medium/img_3.png", "level": "medium", "title": "A mountain landscape", "alt": "Majestic mountain range with snow-capped peaks", "objects": ["mountains", "snow", "peaks"], "actions": ["stand", "rise"], "locations": ["mountain", "outdoor"]},
    {"id": "medium-04", "path": "/images/prompts/medium/img_4.png", "level": "medium", "title": "A kitchen cooking scene", "alt": "Kitchen with cooking utensils and ingredients", "objects": ["kitchen", "utensils", "ingredients"], "actions": ["cook", "prepare"], "locations": ["kitchen", "home"]},
    {"id": "medium-05", "path": "/images/prompts/medium/img_5.png", "level": "medium", "title": "A classroom with students", "alt": "Classroom filled with students and learning materials", "objects": ["students", "classroom", "materials"], "actions": ["learn", "study", "teach"], "locations": ["classroom", "school"]},
    {"id": "medium-06", "path": "/images/prompts/medium/img_6.png", "level": "medium", "title": "A forest path in autumn", "alt": "Forest trail surrounded by autumn-colored trees", "objects": ["trees", "path", "leaves"], "actions": ["grow", "fall"], "locations": ["forest", "outdoor"]},
    {"id": "medium-07", "path": "/images/prompts/medium/img_7.png", "level": "medium", "title": "A sunset over the ocean", "alt": "Beautiful sunset reflecting on ocean waters", "objects": ["sunset", "ocean", "sky"], "actions": ["set", "reflect"], "locations": ["ocean", "horizon"]},
    {"id": "hard-01", "path": "/images/prompts/hard/img_1.png", "level": "hard", "title": "Rainy street with reflections", "alt": "Wet street reflecting city lights in the rain", "objects": ["street", "rain", "reflections", "lights"], "actions": ["rain", "reflect", "shine"], "locations": ["street", "city"]},
    {"id": "hard-02", "path": "/images/prompts/hard/img_2.png", "level": "hard", "title": "A complex architectural structure", "alt": "Intricate building with detailed architectural elements", "objects": ["building", "architecture", "details"], "actions": ["stand", "display"], "locations": ["city", "urban"]},
    {"id": "hard-03", "path": "/images/prompts/hard/img_3.png", "level": "hard", "title": "A detailed nature scene", "alt": "Complex natural landscape with multiple elements", "objects": ["nature", "landscape", "elements"], "actions": ["grow", "exist"], "locations": ["nature", "outdoor"]},
    {"id": "hard-04", "path": "/images/prompts/hard/img_4.png", "level": "hard", "title": "An abstract art composition", "alt": "Abstract artwork with complex patterns and colors", "objects": ["art", "patterns", "colors"], "actions": ["display", "represent"], "locations": ["gallery", "artwork"]},
    {"id": "hard-05", "path": "/images/prompts/hard/img_5.png", "level": "hard", "title": "A complex urban landscape", "alt": "Detailed cityscape with multiple buildings and elements", "objects": ["buildings", "cityscape", "urban elements"], "actions": ["stand", "exist"], "locations": ["city", "urban"]},
    {"id": "hard-06", "path": "/images/prompts/hard/img_6.png", "level": "hard", "title": "A detailed portrait scene", "alt": "Complex portrait with detailed facial features", "objects": ["portrait", "face", "features"], "actions": ["display", "show"], "locations": ["portrait", "artwork"]},
    {"id": "hard-07", "path": "/images/prompts/hard/img_7.png", "level": "hard", "title": "A complex interior design", "alt": "Detailed interior space with multiple design elements", "objects": ["interior", "furniture", "design elements"], "actions": ["display", "show"], "locations": ["interior", "indoor"]},
    {"id": "hard-08", "path": "/images/prompts/hard/img_8.png", "level": "hard", "title": "A detailed street scene", "alt": "Complex street view with multiple urban elements", "objects": ["street", "buildings", "urban elements"], "actions": ["exist", "display"], "locations": ["street", "urban"]},
]

@router.get("/list")
def list_images(level: Literal["easy", "medium", "hard"] | None = Query(None)):
    if level:
        return [i for i in IMAGES if i["level"] == level]
    return IMAGES

@router.get("/next")
def get_next_image(
    current_id: str = Query(..., description="Current image ID"),
    level: Literal["easy", "medium", "hard"] = Query(..., description="Difficulty level")
):
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
