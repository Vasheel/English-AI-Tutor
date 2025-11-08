#!/usr/bin/env python3
"""
Test OpenAI API Connectivity
This script tests if the OpenAI API is accessible and working.
"""

import os
import requests
import json

def test_openai_api():
    """Test OpenAI API connectivity and key validity"""
    
    print("🧪 OPENAI API CONNECTIVITY TEST")
    print("=" * 40)
    
    # Get API key from environment
    api_key = os.getenv("VITE_OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY")
    
    if not api_key:
        print("❌ No OpenAI API key found!")
        print("   Set VITE_OPENAI_API_KEY or OPENAI_API_KEY environment variable")
        return False
    
    print(f"✅ API Key found: {api_key[:10]}...")
    
    # Test API connectivity
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # Test with a simple request
    test_payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "user", "content": "Say 'API test successful'"}
        ],
        "max_tokens": 10
    }
    
    try:
        print("🔄 Testing API connectivity...")
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=test_payload,
            timeout=30
        )
        
        if response.status_code == 200:
            print("✅ API connectivity successful!")
            data = response.json()
            if 'choices' in data and len(data['choices']) > 0:
                message = data['choices'][0]['message']['content']
                print(f"✅ Response: {message}")
                return True
            else:
                print("❌ Unexpected response format")
                return False
        else:
            print(f"❌ API request failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out - API might be slow")
        return False
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - check internet connectivity")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_models():
    """Test which models are available"""
    
    print("\n🔍 MODEL AVAILABILITY TEST")
    print("=" * 30)
    
    api_key = os.getenv("VITE_OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ No API key available for model test")
        return
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    models_to_test = ["gpt-4o-mini", "gpt-3.5-turbo", "gpt-4o"]
    
    for model in models_to_test:
        try:
            response = requests.get(
                f"https://api.openai.com/v1/models/{model}",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                print(f"✅ {model}: Available")
            else:
                print(f"❌ {model}: Not available ({response.status_code})")
                
        except Exception as e:
            print(f"❌ {model}: Error - {e}")

if __name__ == "__main__":
    success = test_openai_api()
    test_models()
    
    if success:
        print("\n🎉 OpenAI API is working correctly!")
        print("   The fallback issue might be in the backend configuration.")
    else:
        print("\n🚨 OpenAI API has issues!")
        print("   Fix the API key or connectivity before testing smart quiz.")
