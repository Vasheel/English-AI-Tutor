# T7 – Security (Rate Limiting) Testing Guide

## Overview

This guide demonstrates how to test and document the rate limiting functionality implemented in the English AI Tutor API. The rate limiting system provides security against abuse while maintaining usability for educational purposes.

## Rate Limiting Configuration

### Endpoint-Specific Limits

| Endpoint                 | Daily Quota | Hourly Quota | Burst Allowance | Purpose           |
| ------------------------ | ----------- | ------------ | --------------- | ----------------- |
| `/api/grammar/evaluate`  | 100/day     | 20/hour      | 5/minute        | AI processing     |
| `/api/quizzes/generate`  | 50/day      | 10/hour      | 2/minute        | AI generation     |
| `/api/images/list`       | 200/day     | 50/hour      | 10/minute       | Static content    |
| `/api/images/next`       | 200/day     | 50/hour      | 10/minute       | Static content    |
| `/api/health`            | 1000/day    | 100/hour     | 20/minute       | Health checks     |
| `/api/rate-limit/status` | 10/day      | 2/hour       | 1/minute        | Status monitoring |

## Testing Methods

### Method 1: Python Test Scripts

#### Quick Demo Script

```bash
python quick_rate_limit_demo.py
```

**What it demonstrates:**

- ✅ **Phase 1:** Successful requests (200 OK) within limits
- 🚫 **Phase 2:** Rate limit exceeded (429 Too Many Requests)
- 🎯 **Phase 3:** Different endpoints with different limits
- 📊 **Phase 4:** Rate limit status endpoint

#### Comprehensive Test Script

```bash
python test_rate_limiting.py
```

**Features:**

- Detailed logging of all requests
- Burst allowance testing
- Multiple endpoint testing
- JSON report generation
- Success rate calculations

### Method 2: Postman Collection

#### Import Collection

1. Open Postman
2. Import `rate_limiting_tests.postman_collection.json`
3. Update the `base_url` variable with your Vercel URL
4. Run the collection in sequence

#### Collection Structure

- **Phase 1:** Successful Requests (200 OK)
- **Phase 2:** Rate Limit Exceeded (429 Too Many Requests)
- **Phase 3:** Different Endpoints, Different Limits
- **Phase 4:** Rate Limit Status

### Method 3: Manual Testing

#### Step 1: Test Successful Responses

```bash
# Test grammar evaluation (should work)
curl -X POST "https://your-app.vercel.app/api/grammar/evaluate" \
  -H "Content-Type: application/json" \
  -d '{"text": "This is a test sentence.", "mode": "minimal"}'
```

**Expected Response:**

```json
{
  "corrected": "This is a test sentence.",
  "grammar_score": 85,
  "context_score": 80,
  "context_passed": true,
  "score": 82,
  "explanations": ["Good job! You provided a detailed description."],
  "context_feedback": [
    "Great description! You included good details about the image."
  ],
  "confidence": "high"
}
```

#### Step 2: Test Rate Limit Exceeded

```bash
# Make multiple rapid requests to trigger rate limiting
for i in {1..10}; do
  curl -X POST "https://your-app.vercel.app/api/grammar/evaluate" \
    -H "Content-Type: application/json" \
    -d "{\"text\": \"Test request $i\", \"mode\": \"minimal\"}"
  sleep 0.1
done
```

**Expected Response (after limit exceeded):**

```json
{
  "error": "Rate limit exceeded",
  "message": "You've reached your daily learning limit! Take a break and come back tomorrow to continue your English learning journey. 📚✨",
  "retry_after": 3600,
  "limit_type": "daily_quota",
  "educational_tip": "Learning is most effective with regular breaks. Try again tomorrow!",
  "suggestion": "Practice offline with the exercises you've already completed."
}
```

## Expected Test Results

### Figure 6.7a: Successful Responses (200 OK)

```
✅ Request   1: /api/grammar/evaluate - 200 OK (245ms)
✅ Request   2: /api/grammar/evaluate - 200 OK (198ms)
✅ Request   3: /api/grammar/evaluate - 200 OK (203ms)
✅ Request   4: /api/grammar/evaluate - 200 OK (189ms)
✅ Request   5: /api/grammar/evaluate - 200 OK (201ms)
```

### Figure 6.7b: Rate Limited Responses (429 Too Many Requests)

```
🚫 Request   6: /api/grammar/evaluate - 429 Rate Limited (156ms)
🚫 Request   7: /api/grammar/evaluate - 429 Rate Limited (142ms)
🚫 Request   8: /api/grammar/evaluate - 429 Rate Limited (138ms)
🚫 Request   9: /api/grammar/evaluate - 429 Rate Limited (145ms)
🚫 Request  10: /api/grammar/evaluate - 429 Rate Limited (151ms)
```

## Educational Error Messages

When rate limits are exceeded, users receive educational messages:

```json
{
  "error": "Rate limit exceeded",
  "message": "You've reached your daily learning limit! Take a break and come back tomorrow to continue your English learning journey. 📚✨",
  "retry_after": 3600,
  "limit_type": "daily_quota",
  "educational_tip": "Learning is most effective with regular breaks. Try again tomorrow!",
  "suggestion": "Practice offline with the exercises you've already completed."
}
```

## Burst Allowance Testing

The system allows burst requests within limits:

```bash
# Test burst allowance (5 requests in 10 seconds)
for i in {1..5}; do
  curl -X POST "https://your-app.vercel.app/api/grammar/evaluate" \
    -H "Content-Type: application/json" \
    -d "{\"text\": \"Burst test $i\", \"mode\": \"minimal\"}"
done
```

**Expected:** All 5 requests should succeed (within burst allowance)

## Rate Limit Status Endpoint

Check current rate limit status:

```bash
curl "https://your-app.vercel.app/api/rate-limit/status"
```

**Response:**

```json
{
  "message": "Rate limiting is active",
  "limits": {
    "grammar_evaluation": "100/day; 20/hour; 5/minute",
    "quiz_generation": "50/day; 10/hour; 2/minute",
    "image_requests": "200/day; 50/hour; 10/minute",
    "status_checks": "10/day"
  },
  "educational_note": "These limits ensure fair usage and encourage regular learning breaks! 📚"
}
```

## Testing Checklist

### ✅ Pre-Testing Setup

- [ ] Update `BASE_URL` in test scripts with your Vercel URL
- [ ] Ensure API is deployed and accessible
- [ ] Import Postman collection (if using Postman)

### ✅ Phase 1: Successful Requests

- [ ] Run 5 grammar evaluation requests
- [ ] Verify all return 200 OK
- [ ] Check response times are reasonable
- [ ] Confirm educational content in responses

### ✅ Phase 2: Rate Limit Exceeded

- [ ] Make 10+ rapid requests to same endpoint
- [ ] Verify 429 responses after limit exceeded
- [ ] Check educational error messages
- [ ] Confirm retry-after headers

### ✅ Phase 3: Different Endpoints

- [ ] Test health endpoint (higher limits)
- [ ] Test images endpoint (moderate limits)
- [ ] Test quiz endpoint (lower limits)
- [ ] Verify different rate limits per endpoint

### ✅ Phase 4: Burst Allowance

- [ ] Test rapid requests within burst allowance
- [ ] Verify burst requests succeed
- [ ] Test burst allowance limits

### ✅ Phase 5: Status Monitoring

- [ ] Check rate limit status endpoint
- [ ] Verify status information accuracy
- [ ] Test status endpoint rate limits

## Documentation Requirements

### For T7 – Security (Rate Limiting) Documentation:

1. **Screenshots/Logs:**

   - Console output showing successful 200 OK responses
   - Console output showing 429 Rate Limited responses
   - Educational error messages in responses

2. **Test Results:**

   - Success rate percentages
   - Rate limit trigger points
   - Response time measurements
   - Burst allowance effectiveness

3. **Configuration Evidence:**
   - Rate limit settings per endpoint
   - Daily/hourly quota configurations
   - Burst allowance settings
   - Educational messaging implementation

## Troubleshooting

### Common Issues

1. **All requests return 429 immediately:**

   - Check if rate limits are too restrictive
   - Verify Redis/memory storage is working
   - Check for existing rate limit data

2. **No rate limiting occurs:**

   - Verify slowapi middleware is enabled
   - Check rate limit configuration
   - Ensure requests are hitting the same endpoint

3. **Inconsistent rate limiting:**
   - Check for multiple API instances
   - Verify rate limit storage backend
   - Check for IP address changes

### Debug Commands

```bash
# Check rate limit status
curl "https://your-app.vercel.app/api/rate-limit/status"

# Test with different IP (if possible)
# Use VPN or different network

# Check response headers
curl -I "https://your-app.vercel.app/api/grammar/evaluate"
```

## Conclusion

The rate limiting system successfully:

- ✅ Prevents API abuse with daily/hourly quotas
- ✅ Allows burst usage for intensive learning sessions
- ✅ Provides educational context in error messages
- ✅ Maintains different limits for different endpoint types
- ✅ Encourages healthy learning habits with breaks

This implementation demonstrates effective security measures while maintaining educational value and user experience.
