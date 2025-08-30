# server/structured_schema.py
QUIZ_RESPONSE_FORMAT = {
    "type": "json_schema",
    "json_schema": {
        "name": "quiz_items",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "items": {
                    "type": "array",
                    "minItems": 3,
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "string"},
                            "type": {"type": "string", "enum": ["mcq", "fitb"]},
                            "question": {"type": "string"},
                            "options": {"type": "array", "items": {"type": "string"}},
                            "answer": { "oneOf": [ {"type":"integer"}, {"type":"string"} ] },
                            "explanation": {"type": "string"}
                        },
                        "required": ["type", "question", "answer"],
                        "additionalProperties": False
                    }
                }
            },
            "required": ["items"],
            "additionalProperties": False
        }
    }
}
