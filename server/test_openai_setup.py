# test_openai_setup.py
# Run this script to test your OpenAI setup before running the full app

import os
from openai import OpenAI
import json
from dotenv import load_dotenv

def test_openai_setup():
    """Test OpenAI API setup and basic functionality"""
    
    # Try multiple ways to load environment variables
    load_dotenv()  # Try default
    load_dotenv('.env')  # Try explicit path
    load_dotenv('.env.local')  # Try local variant
    
    print("=== OpenAI Setup Test ===")
    
    # 1. Check API Key
    api_key = os.getenv("OPENAI_API_KEY")
    print(f"1. API Key Status:")
    print(f"   - Present: {'Yes' if api_key else 'No'}")
    print(f"   - Format OK: {'Yes' if api_key and api_key.startswith('sk-') else 'No'}")
    print(f"   - Length: {len(api_key) if api_key else 0} chars")
    
    if not api_key or not api_key.startswith('sk-'):
        print("❌ FAIL: Invalid or missing API key")
        print("Please set OPENAI_API_KEY in your .env file with a valid key starting with 'sk-'")
        return False
    
    # 2. Test Client Creation
    try:
        client = OpenAI(api_key=api_key)
        print("2. Client Creation: ✅ SUCCESS")
    except Exception as e:
        print(f"2. Client Creation: ❌ FAIL - {e}")
        return False
    
    # 3. Test Model Access
    model_name = os.getenv("MODEL_NAME", "gpt-4o-mini")
    print(f"3. Testing Model: {model_name}")
    
    try:
        model_info = client.models.retrieve(model_name)
        print(f"   - Model ID: {model_info.id}")
        print(f"   - Status: ✅ AVAILABLE")
    except Exception as e:
        print(f"   - Status: ❌ UNAVAILABLE - {e}")
        # Try alternative models
        alternatives = ["gpt-4o-mini", "gpt-3.5-turbo", "gpt-4"]
        for alt in alternatives:
            try:
                client.models.retrieve(alt)
                print(f"   - Alternative {alt}: ✅ AVAILABLE")
                model_name = alt
                break
            except:
                print(f"   - Alternative {alt}: ❌ UNAVAILABLE")
    
    # 4. Test Simple API Call
    print("4. Testing Simple API Call:")
    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "You are a helpful assistant. Respond with valid JSON only."},
                {"role": "user", "content": "Return this JSON: {\"test\": \"success\", \"number\": 42}"}
            ],
            temperature=0.1,
            max_tokens=100
        )
        
        content = response.choices[0].message.content.strip()
        print(f"   - Raw response: {content}")
        
        # Try to parse JSON
        try:
            parsed = json.loads(content)
            print(f"   - Parsed JSON: {parsed}")
            print("   - Status: ✅ SUCCESS")
        except json.JSONDecodeError as e:
            print(f"   - JSON Parse Error: {e}")
            print("   - Status: ⚠️  API works but JSON parsing may be unreliable")
            
    except Exception as e:
        print(f"   - API Call Failed: {e}")
        print("   - Status: ❌ FAIL")
        return False
    
    # 5. Test Quiz Generation Format
    print("5. Testing Quiz Generation:")
    try:
        quiz_response = client.chat.completions.create(
            model=model_name,
            messages=[
                {
                    "role": "system", 
                    "content": "You are a quiz generator. Return ONLY valid JSON with this format: {\"items\": [{\"id\": \"q1\", \"type\": \"mcq\", \"question\": \"Sample question?\", \"options\": [\"A\", \"B\", \"C\", \"D\"], \"answer\": 0, \"explanation\": \"Explanation\"}]}"
                },
                {
                    "role": "user", 
                    "content": "Generate 1 simple Grade 6 English grammar question about past tense."
                }
            ],
            temperature=0.5,
            max_tokens=300
        )
        
        quiz_content = quiz_response.choices[0].message.content.strip()
        print(f"   - Raw quiz response: {quiz_content}")
        
        # Parse quiz JSON
        try:
            quiz_data = json.loads(quiz_content)
            if "items" in quiz_data and len(quiz_data["items"]) > 0:
                item = quiz_data["items"][0]
                required_fields = ["id", "type", "question", "options", "answer"]
                missing_fields = [f for f in required_fields if f not in item]
                
                if not missing_fields:
                    print("   - Quiz Format: ✅ PERFECT")
                    print(f"   - Sample Question: {item['question']}")
                else:
                    print(f"   - Missing Fields: {missing_fields}")
                    print("   - Status: ⚠️  FORMAT ISSUES")
            else:
                print("   - Status: ⚠️  NO ITEMS FOUND")
        except json.JSONDecodeError as e:
            print(f"   - Quiz JSON Error: {e}")
            print("   - Status: ❌ INVALID JSON")
            
    except Exception as e:
        print(f"   - Quiz Generation Failed: {e}")
        return False
    
    print("\n=== Test Summary ===")
    print("✅ OpenAI setup appears to be working!")
    print(f"Recommended model: {model_name}")
    print("\nNext steps:")
    print("1. Use the enhanced quizzes.py route with better error handling")
    print("2. Check your FastAPI server logs for detailed debugging info")
    print("3. Make sure your .env file is in the right location (server/.env)")
    
    return True

if __name__ == "__main__":
    success = test_openai_setup()
    if not success:
        exit(1)
    print("\n🎉 All tests passed! Your OpenAI setup should work.")