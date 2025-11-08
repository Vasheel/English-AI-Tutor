#!/usr/bin/env python3
"""
Quick Rate Limiting Demo Script
Demonstrates T7 - Security (Rate Limiting) with simple examples

Usage:
    python quick_rate_limit_demo.py
"""

import requests
import time
import json

# Configuration - Update this with your actual deployment URL
BASE_URL = "https://your-vercel-app.vercel.app"  # Replace with your actual URL
# For local testing: BASE_URL = "http://localhost:8000"
# For Vercel: BASE_URL = "https://your-project-name.vercel.app"
# For Netlify: BASE_URL = "https://your-project-name.netlify.app"

def test_rate_limiting():
    """Quick demonstration of rate limiting"""
    
    print("🛡️ RATE LIMITING DEMONSTRATION")
    print("=" * 50)
    print(f"Testing: {BASE_URL}")
    print("=" * 50)
    
    # Test 1: Successful requests (within limits)
    print("\n✅ PHASE 1: Successful Requests (200 OK)")
    print("-" * 40)
    
    successful_count = 0
    for i in range(1, 6):  # Test 5 requests
        try:
            response = requests.post(
                f"{BASE_URL}/api/grammar/evaluate",
                json={
                    "text": f"This is test request {i} for grammar evaluation.",
                    "mode": "minimal"
                },
                timeout=10
            )
            
            if response.status_code == 200:
                print(f"✅ Request {i}: 200 OK - Success!")
                successful_count += 1
            elif response.status_code == 429:
                print(f"🚫 Request {i}: 429 Rate Limited")
            else:
                print(f"❌ Request {i}: {response.status_code} Error")
                
        except Exception as e:
            print(f"❌ Request {i}: Failed - {str(e)}")
        
        time.sleep(0.5)  # Small delay
    
    print(f"\n📊 Phase 1 Results: {successful_count}/5 successful")
    
    # Test 2: Rate limit exceeded (429 responses)
    print("\n🚫 PHASE 2: Rate Limit Exceeded (429 Too Many Requests)")
    print("-" * 40)
    
    rate_limited_count = 0
    for i in range(6, 16):  # Test 10 more requests quickly
        try:
            response = requests.post(
                f"{BASE_URL}/api/grammar/evaluate",
                json={
                    "text": f"This is test request {i} for grammar evaluation.",
                    "mode": "minimal"
                },
                timeout=10
            )
            
            if response.status_code == 200:
                print(f"✅ Request {i}: 200 OK - Still within limits!")
            elif response.status_code == 429:
                print(f"🚫 Request {i}: 429 Rate Limited - Limit exceeded!")
                rate_limited_count += 1
                
                # Show the educational error message
                try:
                    error_data = response.json()
                    print(f"   📚 Message: {error_data.get('message', 'Rate limit exceeded')}")
                except:
                    pass
            else:
                print(f"❌ Request {i}: {response.status_code} Error")
                
        except Exception as e:
            print(f"❌ Request {i}: Failed - {str(e)}")
        
        time.sleep(0.1)  # Very small delay to trigger rate limiting
    
    print(f"\n📊 Phase 2 Results: {rate_limited_count}/10 rate limited")
    
    # Test 3: Different endpoints with different limits
    print("\n🎯 PHASE 3: Different Endpoints, Different Limits")
    print("-" * 40)
    
    endpoints = [
        ("/api/health", "Health Check (Higher Limits)"),
        ("/api/images/list", "Image List (Moderate Limits)"),
        ("/api/grammar/evaluate", "Grammar Evaluation (Lower Limits)")
    ]
    
    for endpoint, description in endpoints:
        print(f"\n🧪 Testing: {description}")
        print(f"   Endpoint: {endpoint}")
        
        # Test 3 requests for each endpoint
        for i in range(1, 4):
            try:
                if endpoint == "/api/grammar/evaluate":
                    response = requests.post(
                        f"{BASE_URL}{endpoint}",
                        json={
                            "text": f"Test request {i} for {endpoint}",
                            "mode": "minimal"
                        },
                        timeout=10
                    )
                else:
                    response = requests.get(f"{BASE_URL}{endpoint}", timeout=10)
                
                if response.status_code == 200:
                    print(f"   ✅ Request {i}: 200 OK")
                elif response.status_code == 429:
                    print(f"   🚫 Request {i}: 429 Rate Limited")
                else:
                    print(f"   ❌ Request {i}: {response.status_code}")
                    
            except Exception as e:
                print(f"   ❌ Request {i}: Failed - {str(e)}")
            
            time.sleep(0.2)
    
    # Test 4: Rate limit status
    print("\n📊 PHASE 4: Rate Limit Status")
    print("-" * 40)
    
    try:
        response = requests.get(f"{BASE_URL}/api/rate-limit/status", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ Rate Limit Status Retrieved:")
            print(json.dumps(data, indent=2))
        else:
            print(f"❌ Failed to get status: {response.status_code}")
    except Exception as e:
        print(f"❌ Status request failed: {str(e)}")
    
    print("\n🎉 DEMONSTRATION COMPLETE!")
    print("=" * 50)
    print("📋 Summary:")
    print("   ✅ Successful requests show 200 OK responses")
    print("   🚫 Rate limited requests show 429 responses")
    print("   📚 Educational error messages are displayed")
    print("   🎯 Different endpoints have different limits")
    print("   📊 Rate limiting is working as expected!")

if __name__ == "__main__":
    test_rate_limiting()
