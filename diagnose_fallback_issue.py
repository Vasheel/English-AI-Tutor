#!/usr/bin/env python3
"""
Smart Quiz Fallback Questions Diagnostic
This script helps identify why fallback questions are being used instead of AI-generated ones.
"""

def diagnose_fallback_issue():
    """Diagnose why smart quiz is using fallback questions"""
    
    print("🔍 SMART QUIZ FALLBACK QUESTIONS DIAGNOSTIC")
    print("=" * 60)
    
    print("\n🐛 Problem Identified:")
    print("❌ Smart quiz is using fallback questions instead of AI-generated ones")
    print("❌ Debug message: '[DEBUG] Creating age-appropriate fallback response'")
    
    print("\n🔍 Possible Causes:")
    print("1. OpenAI API Key Issues:")
    print("   - Missing or invalid API key")
    print("   - API key has insufficient credits")
    print("   - API key has expired")
    
    print("\n2. Model Availability Issues:")
    print("   - Configured model (gpt-5) not available")
    print("   - Fallback models (gpt-4o-mini, gpt-3.5-turbo) not accessible")
    print("   - Model validation failing")
    
    print("\n3. API Rate Limiting:")
    print("   - Too many requests to OpenAI API")
    print("   - Rate limit exceeded")
    print("   - Quota exceeded")
    
    print("\n4. Network/Connectivity Issues:")
    print("   - Backend can't reach OpenAI API")
    print("   - Timeout issues")
    print("   - DNS resolution problems")
    
    print("\n5. Backend Configuration Issues:")
    print("   - Environment variables not set correctly")
    print("   - Model configuration problems")
    print("   - API endpoint issues")
    
    print("\n✅ Diagnostic Steps:")
    print("1. Check OpenAI API Key:")
    print("   - Verify VITE_OPENAI_API_KEY is set")
    print("   - Check API key validity in OpenAI dashboard")
    print("   - Ensure sufficient credits/quota")
    
    print("\n2. Check Model Availability:")
    print("   - Test model access: gpt-4o-mini, gpt-3.5-turbo")
    print("   - Verify model permissions")
    print("   - Check for model deprecation")
    
    print("\n3. Check Backend Logs:")
    print("   - Look for specific error messages")
    print("   - Check for timeout errors")
    print("   - Verify API response codes")
    
    print("\n4. Test API Connectivity:")
    print("   - Test OpenAI API directly")
    print("   - Check network connectivity")
    print("   - Verify firewall settings")
    
    print("\n🔧 Quick Fixes:")
    print("1. Update API Key:")
    print("   - Get fresh API key from OpenAI")
    print("   - Update environment variables")
    print("   - Restart backend server")
    
    print("\n2. Use Reliable Model:")
    print("   - Switch to gpt-4o-mini (more reliable)")
    print("   - Update MODEL_NAME environment variable")
    print("   - Test with different models")
    
    print("\n3. Check Rate Limits:")
    print("   - Monitor API usage")
    print("   - Implement proper rate limiting")
    print("   - Add retry logic with backoff")
    
    print("\n🎯 Expected Behavior:")
    print("✅ AI-generated questions with variety")
    print("✅ Questions match difficulty level")
    print("✅ No fallback questions unless API fails")
    print("✅ Proper error handling and logging")
    
    print("\n📊 Fallback Questions Are:")
    print("- Pre-defined basic English questions")
    print("- Suitable for Grade 6 level")
    print("- Always the same questions")
    print("- Not adaptive to difficulty")
    
    print("\n🚀 Next Steps:")
    print("1. Check your OpenAI API key and credits")
    print("2. Verify backend environment variables")
    print("3. Test API connectivity")
    print("4. Check backend logs for specific errors")
    print("5. Consider switching to a more reliable model")

if __name__ == "__main__":
    diagnose_fallback_issue()
