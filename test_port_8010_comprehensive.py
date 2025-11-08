#!/usr/bin/env python3
"""
Comprehensive Rate Limiting Test for Port 8010
Tests the actual server running on port 8010
"""

import requests
import time
import json

BASE_URL = "http://localhost:8010"

def test_rate_limiting_comprehensive():
    """Comprehensive test of rate limiting on port 8010"""
    
    print("🛡️ COMPREHENSIVE RATE LIMITING TEST")
    print("=" * 60)
    print(f"Testing: {BASE_URL}")
    print("=" * 60)
    
    # Test 1: Check if server is running
    print("\n🔍 PHASE 1: Server Health Check")
    print("-" * 40)
    
    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=5)
        if response.status_code == 200:
            print("✅ Server is running and healthy")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Server health check failed: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Cannot connect to server: {str(e)}")
        return
    
    # Test 2: Test grammar endpoint with multiple requests
    print("\n📝 PHASE 2: Grammar Endpoint Rate Limiting Test")
    print("-" * 40)
    print("Making 10 rapid requests to test rate limiting...")
    
    successful_count = 0
    rate_limited_count = 0
    error_count = 0
    
    for i in range(1, 11):
        try:
            start_time = time.time()
            response = requests.post(
                f"{BASE_URL}/api/grammar/evaluate",
                json={
                    "text": f"This is test request {i} for grammar evaluation.",
                    "mode": "minimal"
                },
                timeout=10
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
                    message = error_data.get("message", "Rate limit exceeded")
                    print(f"    📚 Message: {message}")
                except:
                    print("    📚 Message: Rate limit exceeded")
            else:
                print(f"❌ Request {i:2d}: {response.status_code} Error ({response_time*1000:.0f}ms)")
                error_count += 1
                
        except Exception as e:
            print(f"❌ Request {i:2d}: Failed - {str(e)}")
            error_count += 1
        
        # Small delay between requests
        time.sleep(0.1)
    
    print(f"\n📊 Phase 2 Results:")
    print(f"   ✅ Successful: {successful_count}")
    print(f"   🚫 Rate Limited: {rate_limited_count}")
    print(f"   ❌ Errors: {error_count}")
    
    # Test 3: Test different endpoints
    print("\n🎯 PHASE 3: Different Endpoints Test")
    print("-" * 40)
    
    endpoints = [
        ("/api/health", "GET", "Health Check"),
        ("/api/images/list", "GET", "Image List"),
        ("/api/quizzes/generate", "POST", "Quiz Generation")
    ]
    
    for endpoint, method, description in endpoints:
        print(f"\n🧪 Testing: {description}")
        print(f"   Endpoint: {endpoint} ({method})")
        
        for i in range(1, 4):
            try:
                if method == "POST":
                    response = requests.post(
                        f"{BASE_URL}{endpoint}",
                        json={"count": 3, "skills": ["grammar"], "query": "test"},
                        timeout=5
                    )
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
            
            time.sleep(0.2)
    
    # Test 4: Check for rate limit status endpoint
    print("\n📊 PHASE 4: Rate Limit Status Check")
    print("-" * 40)
    
    try:
        response = requests.get(f"{BASE_URL}/api/rate-limit/status", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✅ Rate Limit Status Retrieved:")
            print(json.dumps(data, indent=2))
        else:
            print(f"❌ Rate limit status endpoint not available: {response.status_code}")
    except Exception as e:
        print(f"❌ Rate limit status check failed: {str(e)}")
    
    # Summary
    print("\n🎉 RATE LIMITING TEST COMPLETE!")
    print("=" * 60)
    print("📋 Summary:")
    print(f"   ✅ Successful requests: {successful_count}")
    print(f"   🚫 Rate limited requests: {rate_limited_count}")
    print(f"   ❌ Error requests: {error_count}")
    
    if rate_limited_count > 0:
        print("\n🎯 RATE LIMITING IS WORKING!")
        print("   ✅ Your server has rate limiting implemented")
        print("   📚 Educational error messages are displayed")
        print("   🛡️ API is protected against abuse")
    else:
        print("\n⚠️  RATE LIMITING NOT DETECTED")
        print("   ❌ No 429 responses received")
        print("   💡 Rate limiting may not be implemented on this server")
        print("   🔧 Consider implementing rate limiting for security")
    
    print("\n📸 For T7 Documentation:")
    if rate_limited_count > 0:
        print("   - Figure 6.7a: Successful responses (200 OK)")
        print("   - Figure 6.7b: Rate limited responses (429 Too Many Requests)")
        print("   - Educational error messages in responses")
        print("   - Different rate limits per endpoint")
    else:
        print("   - Figure 6.7a: Successful responses (200 OK)")
        print("   - Figure 6.7b: No rate limiting detected")
        print("   - Consider implementing rate limiting for security")

if __name__ == "__main__":
    test_rate_limiting_comprehensive()
