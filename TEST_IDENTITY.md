# Nova AI Identity System - Testing Guide

## Quick Test Commands

### Health Check

```bash
curl http://localhost:8000/v1/health
```

Expected Response:
```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

---

## English Tests

### Test 1: "Who created you?"

```bash
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Who created you?",
    "conversation_id": "test_english"
  }'
```

**Expected Response:**
```json
{
  "reply": "Nova AI was created by SHAKIL, a Network Engineer based in Dhaka, Bangladesh. He works with ISP networks and advanced network infrastructure systems.",
  "conversation_id": "test_english"
}
```

**Key Point**: Should be answered **instantly** without OpenAI API call ⚡

---

### Test 2: "Who is your owner?"

```bash
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Who is your owner?",
    "conversation_id": "test_english"
  }'
```

**Expected Response**: Same as above

---

### Test 3: "Who made you?"

```bash
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Who made you?",
    "conversation_id": "test_english"
  }'
```

**Expected Response**: Same as above

---

### Test 4: "Tell me about your creator"

```bash
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me about your creator",
    "conversation_id": "test_english"
  }'
```

**Expected Response**: Same as above

---

## Bangla Tests

### Test 5: "তোমাকে কে বানিয়েছে?"

```bash
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "তোমাকে কে বানিয়েছে?",
    "conversation_id": "test_bangla"
  }'
```

**Expected Response:**
```json
{
  "reply": "Nova AI তৈরি করেছেন SHAKIL, যিনি Dhaka, Bangladeshে বসবাসকারী একজন Network Engineer। তিনি ISP networks and advanced network infrastructure systems নিয়ে কাজ করেন।",
  "conversation_id": "test_bangla"
}
```

**Key Point**: Bangla response! ✓

---

### Test 6: "তোমার মালিক কে?"

```bash
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "তোমার মালিক কে?",
    "conversation_id": "test_bangla"
  }'
```

**Expected Response**: Bangla response (same as Test 5)

---

### Test 7: "নোভা কাকে তৈরি করেছে?"

```bash
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "নোভা কাকে তৈরি করেছে?",
    "conversation_id": "test_bangla"
  }'
```

**Expected Response**: Bangla response

---

## Normal Questions (Calls OpenAI)

### Test 8: Regular Question in English

```bash
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is machine learning?",
    "conversation_id": "test_normal"
  }'
```

**Expected Response**: AI-generated response from OpenAI (not creator info)

**Key Point**: Takes 500-2000ms (API call) ⏱️

---

### Test 9: Regular Question in Bangla

```bash
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "মেশিন লার্নিং কি?",
    "conversation_id": "test_normal_bn"
  }'
```

**Expected Response**: AI-generated Bangla response

---

## Multi-turn Conversation Test

### Test 10: Creator Question → Normal Question

```bash
# Step 1: Ask about creator
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Who created you?",
    "conversation_id": "multi_turn"
  }'

# Step 2: Ask normal question (AI remembers previous context)
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What can you help me with?",
    "conversation_id": "multi_turn"
  }'

# Step 3: Check conversation history
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What did I ask before this?",
    "conversation_id": "multi_turn"
  }'
```

**Expected Behavior**:
- Question 1: Identity info (fast)
- Question 2: Normal answer (slower, calls OpenAI)
- Question 3: AI references previous question (remembers context)

---

## Conversation Reset Test

### Test 11: Clear Conversation

```bash
# Reset conversation
curl -X POST http://localhost:8000/v1/reset \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "test_english"
  }'
```

**Expected Response:**
```json
{
  "ok": true,
  "conversation_id": "test_english"
}
```

---

## Mixed Language Test

### Test 12: English Question → Bangla Response

```bash
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Who is SHAKIL?",
    "conversation_id": "mixed_lang"
  }'
```

**Note**: If mostly English, responds in English
(But "SHAKIL" in the question might trigger creator detection)

---

## Performance Verification

### Compare Response Times

#### Creator Question (Optimized)
```bash
time curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Who created you?", "conversation_id": "perf_test"}'
```

**Expected**: <100ms ⚡

#### Normal Question (API Call)
```bash
time curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is AI?", "conversation_id": "perf_test"}'
```

**Expected**: 500-2000ms ⏱️

---

## Python Test Script

```python
import httpx
import asyncio
import time

async def test_identity_system():
    async with httpx.AsyncClient() as client:
        base_url = "http://localhost:8000"

        print("=" * 60)
        print("NOVA AI IDENTITY SYSTEM - TEST SUITE")
        print("=" * 60)

        # Test 1: English Creator Question
        print("\n[Test 1] English: Who created you?")
        start = time.time()
        response = await client.post(
            f"{base_url}/v1/chat",
            json={
                "message": "Who created you?",
                "conversation_id": "test_1"
            }
        )
        duration = time.time() - start
        data = response.json()
        print(f"Response: {data['reply'][:50]}...")
        print(f"Time: {duration:.3f}s (should be <100ms)")
        assert "SHAKIL" in data["reply"]
        assert "Network Engineer" in data["reply"]
        print("✓ PASSED")

        # Test 2: Bangla Creator Question
        print("\n[Test 2] Bangla: তোমাকে কে বানিয়েছে?")
        start = time.time()
        response = await client.post(
            f"{base_url}/v1/chat",
            json={
                "message": "তোমাকে কে বানিয়েছে?",
                "conversation_id": "test_2"
            }
        )
        duration = time.time() - start
        data = response.json()
        print(f"Response: {data['reply'][:50]}...")
        print(f"Time: {duration:.3f}s (should be <100ms)")
        assert "SHAKIL" in data["reply"]
        print("✓ PASSED")

        # Test 3: Normal English Question
        print("\n[Test 3] Normal: What is machine learning?")
        start = time.time()
        response = await client.post(
            f"{base_url}/v1/chat",
            json={
                "message": "What is machine learning?",
                "conversation_id": "test_3"
            }
        )
        duration = time.time() - start
        data = response.json()
        print(f"Response: {data['reply'][:50]}...")
        print(f"Time: {duration:.3f}s (should be 500-2000ms)")
        assert len(data["reply"]) > 0
        print("✓ PASSED")

        # Test 4: Reset
        print("\n[Test 4] Reset Conversation")
        response = await client.post(
            f"{base_url}/v1/reset",
            json={"conversation_id": "test_3"}
        )
        data = response.json()
        assert data["ok"] == True
        print(f"Cleared: {data['conversation_id']}")
        print("✓ PASSED")

        print("\n" + "=" * 60)
        print("ALL TESTS PASSED! ✓")
        print("=" * 60)

asyncio.run(test_identity_system())
```

**Run the test:**
```bash
python test_identity.py
```

---

## Expected Logs

### Creator Question
```
2024-01-15 10:30:45 [INFO] Creator question detected (English): Who created you?
2024-01-15 10:30:45 [INFO] Creator question answered (language=en): conversation=test_english, reply_length=142
```

### Normal Question
```
2024-01-15 10:31:00 [DEBUG] Calling OpenAI gpt-4.1-mini for conversation test_normal with 0 history messages
2024-01-15 10:31:01 [INFO] OpenAI response: conversation=test_normal, model=gpt-4.1-mini, reply_length=185
```

---

## Verification Checklist

- [ ] Health endpoint works
- [ ] English creator question detected and answered instantly
- [ ] Bangla creator question detected and answered instantly
- [ ] Bangla response is in Bangla
- [ ] English response is in English
- [ ] Creator info contains "SHAKIL"
- [ ] Creator info contains "Network Engineer"
- [ ] Normal questions still call OpenAI
- [ ] Conversation history is maintained
- [ ] Reset endpoint works
- [ ] Response times are optimized for creator questions
- [ ] No errors in logs

---

## Common Issues & Solutions

### Creator Response Not Returned

**Check**: Pattern matching
```python
# Test pattern
import re
message = "Who created you?"
pattern = r"\bwho\s+(?:created|made|built|developed|designed)\s+(?:you|nova)"
print(re.search(pattern, message.lower(), re.IGNORECASE))
```

### Wrong Language Detected

**Check**: Language detection
```python
from src.services.openai_service import detect_language
print(detect_language("তোমাকে কে বানিয়েছে?"))  # Should be "bn"
print(detect_language("Who created you?"))     # Should be "en"
```

### API Still Called for Creator Question

**Check**: is_creator_question function
```python
from src.services.openai_service import is_creator_question
print(is_creator_question("Who created you?"))  # Should be True
```

---

## Summary

✅ Creator questions answered instantly (<100ms)
✅ Multilingual support (English/Bangla)
✅ Consistent responses
✅ Conversation memory maintained
✅ Logs track all activity
✅ Normal questions still work perfectly

**The Nova AI Identity System is working perfectly!**
