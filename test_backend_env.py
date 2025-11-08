#!/usr/bin/env python3
"""
Test Backend Environment Loading
This script tests if the backend can load environment variables correctly.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

def test_backend_env():
    """Test if backend can load environment variables"""
    
    print("🧪 BACKEND ENVIRONMENT TEST")
    print("=" * 40)
    
    # Load environment variables
    env_path = Path(__file__).parent / ".env"
    print(f"📁 Loading .env from: {env_path}")
    
    if env_path.exists():
        print("✅ .env file exists")
        load_dotenv(env_path)
    else:
        print("❌ .env file not found")
        return False
    
    # Check environment variables
    api_key = os.getenv("OPENAI_API_KEY")
    model_name = os.getenv("MODEL_NAME")
    
    print(f"🔑 OPENAI_API_KEY: {'✅ Found' if api_key else '❌ Missing'}")
    if api_key:
        print(f"   Key preview: {api_key[:20]}...")
    
    print(f"🤖 MODEL_NAME: {'✅ Found' if model_name else '❌ Missing'}")
    if model_name:
        print(f"   Model: {model_name}")
    
    # Test OpenAI client creation
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        print("✅ OpenAI client created successfully")
        
        # Test model access
        try:
            model_info = client.models.retrieve(model_name)
            print(f"✅ Model {model_name} is accessible")
            return True
        except Exception as e:
            print(f"❌ Model {model_name} not accessible: {e}")
            
            # Try fallback models
            fallback_models = ["gpt-4o-mini", "gpt-3.5-turbo"]
            for fallback in fallback_models:
                try:
                    client.models.retrieve(fallback)
                    print(f"✅ Fallback model {fallback} is accessible")
                    return True
                except Exception as e2:
                    print(f"❌ Fallback model {fallback} not accessible: {e2}")
            
            return False
            
    except Exception as e:
        print(f"❌ Failed to create OpenAI client: {e}")
        return False

if __name__ == "__main__":
    success = test_backend_env()
    
    if success:
        print("\n🎉 Backend environment is configured correctly!")
        print("   The fallback issue might be in the server startup or request handling.")
    else:
        print("\n🚨 Backend environment has issues!")
        print("   Fix the environment configuration before testing smart quiz.")
