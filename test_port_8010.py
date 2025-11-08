#!/usr/bin/env python3
"""
Quick Rate Limiting Test for Port 8010
"""

import requests
import time

def test_port_8010():
    print("🧪 Testing Rate Limiting on Port 8010")
    print("=" * 50)
    
    for i in range(1, 8):
        try:
            r = requests.post('http://localhost:8010/api/grammar/evaluate', 
                             json={'text': f'test request {i}', 'mode': 'minimal'}, 
                             timeout=5)
            status = 'Rate Limited' if r.status_code == 429 else 'OK'
            print(f"Request {i}: {r.status_code} - {status}")
            
            if r.status_code == 429:
                try:
                    data = r.json()
                    print(f"  Message: {data.get('message', 'Rate limit exceeded')}")
                except:
                    print("  Message: Rate limit exceeded")
                    
        except Exception as e:
            print(f"Request {i}: Error - {str(e)}")
        
        time.sleep(0.1)
    
    print("\n✅ Test Complete!")

if __name__ == "__main__":
    test_port_8010()
