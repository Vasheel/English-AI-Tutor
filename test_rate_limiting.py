#!/usr/bin/env python3
"""
Rate Limiting Test Script for English AI Tutor API
Demonstrates T7 - Security (Rate Limiting) functionality

This script tests:
1. Successful responses (200 OK) within rate limits
2. Rate limit exceeded responses (429 Too Many Requests)
3. Different endpoints with different rate limits
4. Burst allowance testing
5. Educational error messages

Usage:
    python test_rate_limiting.py
"""

import requests
import time
import json
from datetime import datetime
import sys

# Configuration
BASE_URL = "https://your-vercel-app.vercel.app"  # Replace with your actual Vercel URL
# For local testing: BASE_URL = "http://localhost:8000"

class RateLimitTester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.session = requests.Session()
        self.results = []
        
    def log_result(self, endpoint, request_num, status_code, response_time, message=""):
        """Log test result"""
        result = {
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "endpoint": endpoint,
            "request_number": request_num,
            "status_code": status_code,
            "response_time_ms": round(response_time * 1000, 2),
            "message": message
        }
        self.results.append(result)
        
        # Print colored output
        if status_code == 200:
            print(f"✅ Request {request_num:3d}: {endpoint} - {status_code} OK ({response_time*1000:.0f}ms)")
        elif status_code == 429:
            print(f"🚫 Request {request_num:3d}: {endpoint} - {status_code} Rate Limited ({response_time*1000:.0f}ms)")
        else:
            print(f"❌ Request {request_num:3d}: {endpoint} - {status_code} Error ({response_time*1000:.0f}ms)")
    
    def test_endpoint(self, endpoint, max_requests=120, delay=0.1):
        """Test rate limiting for a specific endpoint"""
        print(f"\n🧪 Testing Rate Limiting: {endpoint}")
        print(f"📊 Max Requests: {max_requests}, Delay: {delay}s")
        print("=" * 60)
        
        successful_requests = 0
        rate_limited_requests = 0
        
        for i in range(1, max_requests + 1):
            start_time = time.time()
            
            try:
                if endpoint == "/api/grammar/evaluate":
                    response = self.session.post(
                        f"{self.base_url}{endpoint}",
                        json={
                            "text": f"This is test request number {i} for grammar evaluation.",
                            "mode": "minimal"
                        },
                        timeout=10
                    )
                elif endpoint == "/api/quizzes/generate":
                    response = self.session.post(
                        f"{self.base_url}{endpoint}",
                        json={
                            "count": 3,
                            "skills": ["grammar", "vocabulary"],
                            "query": f"Test quiz {i}"
                        },
                        timeout=10
                    )
                elif endpoint == "/api/images/list":
                    response = self.session.get(
                        f"{self.base_url}{endpoint}",
                        timeout=10
                    )
                elif endpoint == "/api/health":
                    response = self.session.get(
                        f"{self.base_url}{endpoint}",
                        timeout=10
                    )
                else:
                    response = self.session.get(
                        f"{self.base_url}{endpoint}",
                        timeout=10
                    )
                
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    successful_requests += 1
                    self.log_result(endpoint, i, 200, response_time, "Success")
                elif response.status_code == 429:
                    rate_limited_requests += 1
                    try:
                        error_data = response.json()
                        message = error_data.get("message", "Rate limit exceeded")
                    except:
                        message = "Rate limit exceeded"
                    self.log_result(endpoint, i, 429, response_time, message)
                else:
                    self.log_result(endpoint, i, response.status_code, response_time, f"Error: {response.text}")
                
            except requests.exceptions.RequestException as e:
                response_time = time.time() - start_time
                self.log_result(endpoint, i, 0, response_time, f"Request failed: {str(e)}")
            
            # Small delay between requests
            if delay > 0:
                time.sleep(delay)
        
        print(f"\n📈 Results for {endpoint}:")
        print(f"   ✅ Successful: {successful_requests}")
        print(f"   🚫 Rate Limited: {rate_limited_requests}")
        print(f"   📊 Success Rate: {(successful_requests/max_requests)*100:.1f}%")
        
        return successful_requests, rate_limited_requests
    
    def test_burst_allowance(self, endpoint, burst_size=10):
        """Test burst allowance - rapid requests"""
        print(f"\n🚀 Testing Burst Allowance: {endpoint}")
        print(f"📊 Burst Size: {burst_size} requests")
        print("=" * 60)
        
        successful_requests = 0
        rate_limited_requests = 0
        
        for i in range(1, burst_size + 1):
            start_time = time.time()
            
            try:
                if endpoint == "/api/grammar/evaluate":
                    response = self.session.post(
                        f"{self.base_url}{endpoint}",
                        json={
                            "text": f"Burst test request {i} for grammar evaluation.",
                            "mode": "minimal"
                        },
                        timeout=5
                    )
                elif endpoint == "/api/images/list":
                    response = self.session.get(
                        f"{self.base_url}{endpoint}",
                        timeout=5
                    )
                else:
                    response = self.session.get(
                        f"{self.base_url}{endpoint}",
                        timeout=5
                    )
                
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    successful_requests += 1
                    self.log_result(endpoint, i, 200, response_time, "Burst Success")
                elif response.status_code == 429:
                    rate_limited_requests += 1
                    try:
                        error_data = response.json()
                        message = error_data.get("message", "Rate limit exceeded")
                    except:
                        message = "Rate limit exceeded"
                    self.log_result(endpoint, i, 429, response_time, message)
                else:
                    self.log_result(endpoint, i, response.status_code, response_time, f"Error: {response.text}")
                
            except requests.exceptions.RequestException as e:
                response_time = time.time() - start_time
                self.log_result(endpoint, i, 0, response_time, f"Request failed: {str(e)}")
        
        print(f"\n📈 Burst Results for {endpoint}:")
        print(f"   ✅ Successful: {successful_requests}")
        print(f"   🚫 Rate Limited: {rate_limited_requests}")
        print(f"   📊 Burst Success Rate: {(successful_requests/burst_size)*100:.1f}%")
        
        return successful_requests, rate_limited_requests
    
    def test_rate_limit_status(self):
        """Test rate limit status endpoint"""
        print(f"\n📊 Testing Rate Limit Status Endpoint")
        print("=" * 60)
        
        try:
            response = self.session.get(f"{self.base_url}/api/rate-limit/status", timeout=10)
            response_time = time.time()
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Rate Limit Status Retrieved:")
                print(json.dumps(data, indent=2))
                self.log_result("/api/rate-limit/status", 1, 200, 0.1, "Status retrieved")
            else:
                print(f"❌ Failed to get status: {response.status_code}")
                self.log_result("/api/rate-limit/status", 1, response.status_code, 0.1, "Status failed")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Request failed: {str(e)}")
            self.log_result("/api/rate-limit/status", 1, 0, 0.1, f"Request failed: {str(e)}")
    
    def generate_report(self):
        """Generate a comprehensive test report"""
        print(f"\n📋 RATE LIMITING TEST REPORT")
        print("=" * 80)
        print(f"Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Base URL: {self.base_url}")
        print(f"Total Requests: {len(self.results)}")
        
        # Count by status code
        status_counts = {}
        for result in self.results:
            status = result["status_code"]
            status_counts[status] = status_counts.get(status, 0) + 1
        
        print(f"\n📊 Status Code Summary:")
        for status, count in sorted(status_counts.items()):
            if status == 200:
                print(f"   ✅ 200 OK: {count} requests")
            elif status == 429:
                print(f"   🚫 429 Rate Limited: {count} requests")
            else:
                print(f"   ❌ {status} Error: {count} requests")
        
        # Calculate success rate
        total_requests = len(self.results)
        successful_requests = status_counts.get(200, 0)
        rate_limited_requests = status_counts.get(429, 0)
        
        print(f"\n📈 Overall Statistics:")
        print(f"   Total Requests: {total_requests}")
        print(f"   Successful: {successful_requests}")
        print(f"   Rate Limited: {rate_limited_requests}")
        print(f"   Success Rate: {(successful_requests/total_requests)*100:.1f}%")
        print(f"   Rate Limit Rate: {(rate_limited_requests/total_requests)*100:.1f}%")
        
        # Save detailed results to file
        with open("rate_limiting_test_results.json", "w") as f:
            json.dump({
                "test_date": datetime.now().isoformat(),
                "base_url": self.base_url,
                "total_requests": total_requests,
                "successful_requests": successful_requests,
                "rate_limited_requests": rate_limited_requests,
                "success_rate": (successful_requests/total_requests)*100,
                "rate_limit_rate": (rate_limited_requests/total_requests)*100,
                "detailed_results": self.results
            }, f, indent=2)
        
        print(f"\n💾 Detailed results saved to: rate_limiting_test_results.json")

def main():
    """Main test function"""
    print("🛡️ RATE LIMITING TEST SUITE")
    print("=" * 80)
    print("Testing T7 - Security (Rate Limiting) functionality")
    print(f"Base URL: {BASE_URL}")
    print("=" * 80)
    
    # Initialize tester
    tester = RateLimitTester(BASE_URL)
    
    # Test rate limit status first
    tester.test_rate_limit_status()
    
    # Test different endpoints with different rate limits
    print(f"\n🎯 TESTING DIFFERENT ENDPOINTS")
    print("=" * 80)
    
    # Test 1: Health endpoint (should have higher limits)
    print(f"\n1️⃣ Testing Health Endpoint (Higher Limits)")
    tester.test_endpoint("/api/health", max_requests=50, delay=0.05)
    
    # Test 2: Images endpoint (moderate limits)
    print(f"\n2️⃣ Testing Images Endpoint (Moderate Limits)")
    tester.test_endpoint("/api/images/list", max_requests=30, delay=0.1)
    
    # Test 3: Grammar endpoint (lower limits)
    print(f"\n3️⃣ Testing Grammar Endpoint (Lower Limits)")
    tester.test_endpoint("/api/grammar/evaluate", max_requests=15, delay=0.2)
    
    # Test 4: Quiz endpoint (lowest limits)
    print(f"\n4️⃣ Testing Quiz Endpoint (Lowest Limits)")
    tester.test_endpoint("/api/quizzes/generate", max_requests=10, delay=0.3)
    
    # Test 5: Burst allowance testing
    print(f"\n5️⃣ Testing Burst Allowance")
    tester.test_burst_allowance("/api/grammar/evaluate", burst_size=8)
    tester.test_burst_allowance("/api/images/list", burst_size=15)
    
    # Generate comprehensive report
    tester.generate_report()
    
    print(f"\n🎉 Rate Limiting Test Complete!")
    print(f"📊 Check the generated report for detailed results")
    print(f"💡 Use these results to demonstrate T7 - Security (Rate Limiting)")

if __name__ == "__main__":
    main()
