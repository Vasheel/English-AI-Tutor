from fastapi import FastAPI, Query
from typing import List, Literal
import json

app = FastAPI()

# Image data (copied from server/routes/images.py)
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

@app.get("/api/images/list")
def list_images(level: Literal["easy", "medium", "hard"] | None = Query(None)):
    if level:
        return [i for i in IMAGES if i["level"] == level]
    return IMAGES

@app.get("/api/images/next")
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

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Image API is working"}

# Export for Vercel
handler = app
