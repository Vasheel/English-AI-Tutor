#!/usr/bin/env python3
"""
Aggressive Rate Limiting Test
Tests rate limiting with rapid requests to trigger limits
"""

import requests
import time
import json

BASE_URL = "http://localhost:8010"

def test_aggressive_rate_limiting():
    """Test rate limiting with rapid requests"""
    
    print("🚀 AGGRESSIVE RATE LIMITING TEST")
    print("=" * 50)
    print(f"Testing: {BASE_URL}")
    print("=" * 50)
    
    # Test 1: Make 10 rapid requests to trigger rate limiting
    print("\n🔥 PHASE 1: Rapid Requests (Should trigger rate limiting)")
    print("-" * 50)
    
    successful_count = 0
    rate_limited_count = 0
    error_count = 0
    
    for i in range(1, 11):
        try:
            start_time = time.time()
            response = requests.post(
                f"{BASE_URL}/api/grammar/evaluate",
                json={
                    "text": f"This is rapid test request {i} for grammar evaluation.",
                    "mode": "minimal"
                },
                timeout=5
            )
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                print(f"✅ Request {i:2d}: 200 OK ({response_time*1000:.0f}ms)")
                successful_count += 1
            elif response.status_code == 429:
                print(f"🚫 Request {i:2d}: 429 Rate Limited ({response_time*1000:.0f}ms)")
                rate_limited_count += 1
                try:
                    error_data = response.json()
                    print(f"    📚 Message: {error_data.get('message', 'Rate limit exceeded')}")
                except:
                    pass
            else:
                print(f"❌ Request {i:2d}: {response.status_code} Error ({response_time*1000:.0f}ms)")
                error_count += 1
                try:
                    error_text = response.text[:100]
                    print(f"    Error: {error_text}")
                except:
                    pass
                
        except Exception as e:
            print(f"❌ Request {i:2d}: Failed - {str(e)}")
            error_count += 1
        
        # Very small delay to make requests rapid
        time.sleep(0.05)
    
    print(f"\n📊 Phase 1 Results:")
    print(f"   ✅ Successful: {successful_count}")
    print(f"   🚫 Rate Limited: {rate_limited_count}")
    print(f"   ❌ Errors: {error_count}")
    
    # Test 2: Test different endpoints
    print("\n🎯 PHASE 2: Different Endpoints")
    print("-" * 50)
    
    endpoints = [
        ("/api/health", "GET"),
        ("/api/images/list", "GET"),
        ("/api/rate-limit/status", "GET")
    ]
    
    for endpoint, method in endpoints:
        print(f"\n🧪 Testing: {endpoint} ({method})")
        
        for i in range(1, 4):
            try:
                if method == "POST":
                    response = requests.post(f"{BASE_URL}{endpoint}", timeout=5)
                else:
                    response = requests.get(f"{BASE_URL}{endpoint}", timeout=5)
                
                if response.status_code == 200:
                    print(f"   ✅ Request {i}: 200 OK")
                elif response.status_code == 429:
                    print(f"   🚫 Request {i}: 429 Rate Limited")
                else:
                    print(f"   ❌ Request {i}: {response.status_code}")
                    
            except Exception as e:
                print(f"   ❌ Request {i}: Failed - {str(e)}")
            
            time.sleep(0.1)
    
    # Test 3: Check rate limit status
    print("\n📊 PHASE 3: Rate Limit Status")
    print("-" * 50)
    
    try:
        response = requests.get(f"{BASE_URL}/api/rate-limit/status", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✅ Rate Limit Status:")
            print(json.dumps(data, indent=2))
        else:
            print(f"❌ Failed to get status: {response.status_code}")
    except Exception as e:
        print(f"❌ Status request failed: {str(e)}")
    
    print("\n🎉 AGGRESSIVE TESTING COMPLETE!")
    print("=" * 50)
    print("📋 Summary:")
    print(f"   ✅ Successful requests: {successful_count}")
    print(f"   🚫 Rate limited requests: {rate_limited_count}")
    print(f"   ❌ Error requests: {error_count}")
    
    if rate_limited_count > 0:
        print("   🎯 Rate limiting is working!")
    else:
        print("   ⚠️  Rate limiting may not be working properly")

if __name__ == "__main__":
    test_aggressive_rate_limiting()
