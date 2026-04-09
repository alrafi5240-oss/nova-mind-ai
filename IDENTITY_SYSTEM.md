# Nova AI Identity System - Documentation

## Overview

A professional identity and behavior system for Nova AI that:
- Identifies the AI as "Nova AI" created by "SHAKIL"
- Detects creator-related questions in English and Bangla
- Returns optimized responses without calling OpenAI for identity questions
- Uses a strong system prompt to define AI behavior
- Handles multilingual responses automatically

---

## Features

### ✅ AI Identity
- **Name**: Nova AI
- **Creator**: SHAKIL
- **Creator Title**: Network Engineer
- **Creator Location**: Dhaka, Bangladesh
- **Creator Expertise**: ISP networks and advanced network infrastructure systems

### ✅ Creator Question Detection
Automatically detects questions like:
- English: "Who created you?", "Who is your owner?", "Who made you?"
- Bangla: "তোমাকে কে বানিয়েছে?", "তোমার মালিক কে?", "নোভা কাকে তৈরি করেছে?"

### ✅ Language Detection
- Automatically detects English vs Bangla
- Returns responses in the appropriate language
- Supports mixed language input (detects dominant language)

### ✅ Optimized Responses
- Creator questions are answered **without** calling OpenAI API
- Reduces latency and API costs
- Returns consistent, predefined responses
- Still stored in conversation memory

### ✅ Enhanced System Prompt
Instructs OpenAI to understand Nova AI's identity and behave professionally

---

## Implementation Details

### File: `src/services/openai_service.py`

#### Constants

```python
AI_NAME = "Nova AI"
AI_CREATOR = "SHAKIL"
AI_CREATOR_TITLE = "Network Engineer"
AI_CREATOR_LOCATION = "Dhaka, Bangladesh"
AI_CREATOR_EXPERTISE = "ISP networks and advanced network infrastructure systems"
```

#### Creator Responses

**English:**
```
Nova AI was created by SHAKIL, a Network Engineer based in Dhaka, Bangladesh.
He works with ISP networks and advanced network infrastructure systems.
```

**Bangla:**
```
Nova AI তৈরি করেছেন SHAKIL, যিনি Dhaka, Bangladeshে বসবাসকারী একজন Network Engineer।
তিনি ISP networks and advanced network infrastructure systems নিয়ে কাজ করেন।
```

#### System Prompt

```
You are Nova AI, an intelligent and helpful AI assistant created by SHAKIL,
a Network Engineer based in Dhaka, Bangladesh.

Your characteristics:
- Professional and knowledgeable
- Helpful and respectful
- Accurate and truthful
- Multilingual (English and Bengali)
- Capable of discussing technology, networks, and general topics

Always maintain a professional tone and provide accurate information.
```

---

## Functions

### `detect_language(text: str) -> str`

Detects if the input is in English or Bangla.

**Parameters:**
- `text` (str): Input text to analyze

**Returns:**
- `"bn"` for Bangla
- `"en"` for English (default)

**Logic:**
- Counts Bangla unicode characters (\u0980-\u09FF)
- Counts English alphabetic characters
- Returns dominant language

**Example:**
```python
detect_language("তোমাকে কে বানিয়েছে?")  # Returns "bn"
detect_language("Who created you?")       # Returns "en"
```

---

### `is_creator_question(message: str) -> bool`

Checks if message is asking about the creator/owner.

**Parameters:**
- `message` (str): User message

**Returns:**
- `True` if message matches creator patterns
- `False` otherwise

**Patterns (English):**
- "who created you"
- "who made you"
- "who is your creator"
- "your creator"
- "who is your owner"
- "your owner"
- And more (12 patterns total)

**Patterns (Bangla):**
- "তোমাকে কে বানিয়েছে"
- "তোমার মালিক"
- "তোমার সৃষ্টিকর্তা"
- "নোভা কাকে তৈরি করেছে"
- And more (6 patterns total)

**Example:**
```python
is_creator_question("Who created Nova AI?")      # Returns True
is_creator_question("তোমার মালিক কে?")          # Returns True
is_creator_question("What is AI?")               # Returns False
```

---

### `get_creator_response(language: str) -> str`

Returns the creator information in the appropriate language.

**Parameters:**
- `language` (str): "en" for English, "bn" for Bangla

**Returns:**
- Creator information message in the requested language

**Example:**
```python
get_creator_response("en")  # Returns English response
get_creator_response("bn")  # Returns Bangla response
```

---

## Chat Flow

### For Creator Questions

```
User Message
    ↓
Detect Language (English/Bangla)
    ↓
Check if Creator Question?
    ├─ YES → is_creator_question()
    │  ├─ Get Creator Response → get_creator_response()
    │  ├─ Store in Memory
    │  └─ Return Response (NO OpenAI call)
    │
    └─ NO → Continue normal flow
```

### For Normal Messages

```
User Message
    ↓
Detect Language
    ↓
Check if Creator Question? → NO
    ↓
Get Conversation History
    ↓
Build Messages List with System Prompt
    ↓
Call OpenAI API
    ↓
Store in Memory
    ↓
Return Response
```

---

## Usage Examples

### Test Creator Question Detection

#### English

```bash
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Who created you?",
    "conversation_id": "test_user"
  }'
```

**Response:**
```json
{
  "reply": "Nova AI was created by SHAKIL, a Network Engineer based in Dhaka, Bangladesh. He works with ISP networks and advanced network infrastructure systems.",
  "conversation_id": "test_user"
}
```

#### Bangla

```bash
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "তোমাকে কে বানিয়েছে?",
    "conversation_id": "test_user"
  }'
```

**Response:**
```json
{
  "reply": "Nova AI তৈরি করেছেন SHAKIL, যিনি Dhaka, Bangladeshে বসবাসকারী একজন Network Engineer। তিনি ISP networks and advanced network infrastructure systems নিয়ে কাজ করেন।",
  "conversation_id": "test_user"
}
```

### Python Example

```python
import httpx
import asyncio

async def test_identity_system():
    async with httpx.AsyncClient() as client:
        # Test 1: English creator question
        response = await client.post(
            "http://localhost:8000/v1/chat",
            json={
                "message": "Who is your owner?",
                "conversation_id": "user_123"
            }
        )
        print("English:", response.json()["reply"])

        # Test 2: Bangla creator question
        response = await client.post(
            "http://localhost:8000/v1/chat",
            json={
                "message": "তোমার মালিক কে?",
                "conversation_id": "user_456"
            }
        )
        print("Bangla:", response.json()["reply"])

        # Test 3: Normal question (calls OpenAI)
        response = await client.post(
            "http://localhost:8000/v1/chat",
            json={
                "message": "What is machine learning?",
                "conversation_id": "user_789"
            }
        )
        print("Normal:", response.json()["reply"])

asyncio.run(test_identity_system())
```

---

## Logging

All identity system operations are logged:

```
[INFO] Creator question detected (English): Who created you?
[INFO] Creator question answered (language=en): conversation=test_user, reply_length=142
[DEBUG] Calling OpenAI gpt-4.1-mini for conversation test_user with 0 history messages
```

---

## Customization

### Changing Creator Information

Edit `src/services/openai_service.py`:

```python
# Change creator name
AI_CREATOR = "YOUR_NAME"

# Change creator title
AI_CREATOR_TITLE = "Your Title"

# Change location
AI_CREATOR_LOCATION = "Your Location, Country"

# Change expertise
AI_CREATOR_EXPERTISE = "Your expertise"
```

Then update the response messages:

```python
CREATOR_RESPONSE_EN = (
    f"{AI_NAME} was created by {AI_CREATOR}, a {AI_CREATOR_TITLE} based in "
    f"{AI_CREATOR_LOCATION}. He works with {AI_CREATOR_EXPERTISE}."
)

CREATOR_RESPONSE_BN = (
    f"{AI_NAME} তৈরি করেছেন {AI_CREATOR}, যিনি {AI_CREATOR_LOCATION}ে বসবাসকারী একজন "
    f"{AI_CREATOR_TITLE}। তিনি {AI_CREATOR_EXPERTISE} নিয়ে কাজ করেন।"
)
```

### Adding More Creator Patterns

To detect more question variations, add patterns:

```python
# English patterns
CREATOR_PATTERNS_EN = [
    # ... existing patterns ...
    r"\byour\s+(?:background|history|origins)",
]

# Bangla patterns
CREATOR_PATTERNS_BN = [
    # ... existing patterns ...
    r"তুমি\s+কোথা\s+থেকে\s+এসেছ",
]
```

### Customizing System Prompt

Edit the `SYSTEM_PROMPT`:

```python
SYSTEM_PROMPT = f"""You are {AI_NAME}, an intelligent and helpful AI assistant.

Your creator is {AI_CREATOR}, a {AI_CREATOR_TITLE} from {AI_CREATOR_LOCATION}.

[Add more instructions about behavior, tone, capabilities, etc.]
"""
```

---

## Performance Benefits

### Optimization: Skipping OpenAI API Calls

For creator questions:
- **Latency Reduction**: ~500-2000ms saved (no API call)
- **Cost Reduction**: $0 (no API token usage)
- **Consistency**: Always same response
- **Reliability**: No API errors for identity questions

### Memory Usage

- Creator responses stored in conversation memory
- Maintained conversation context
- Can be retrieved later with history

---

## Testing

### Unit Test Example

```python
from src.services.openai_service import (
    detect_language,
    is_creator_question,
    get_creator_response
)

def test_language_detection():
    assert detect_language("Hello") == "en"
    assert detect_language("হ্যালো") == "bn"

def test_creator_detection():
    assert is_creator_question("Who created you?") == True
    assert is_creator_question("তোমাকে কে বানিয়েছে?") == True
    assert is_creator_question("How are you?") == False

def test_creator_response():
    response_en = get_creator_response("en")
    assert "SHAKIL" in response_en
    assert "Network Engineer" in response_en

    response_bn = get_creator_response("bn")
    assert "SHAKIL" in response_bn
```

---

## Integration Checklist

- ✅ `src/services/openai_service.py` - Updated with identity system
- ✅ Language detection (English/Bangla)
- ✅ Creator question patterns (English)
- ✅ Creator question patterns (Bangla)
- ✅ Optimized response handling (no OpenAI call)
- ✅ Enhanced system prompt
- ✅ Conversation memory integration
- ✅ Comprehensive logging
- ✅ Error handling maintained
- ✅ Existing features preserved

---

## Troubleshooting

### Creator Question Not Detected

**Issue**: Pattern not matching

**Solution**: Check regex patterns, ensure message format matches

```python
# Debug: Test pattern matching
import re
message = "Who created you?"
pattern = r"\bwho\s+(?:created|made|built|developed|designed)\s+(?:you|nova)"
print(re.search(pattern, message.lower(), re.IGNORECASE))  # Should match
```

### Wrong Language Detected

**Issue**: Mixed language not detected correctly

**Solution**: Dominant language is used. If mostly Bangla but few English words, still detected as Bangla.

```python
# Debug: Check language detection
print(detect_language("তোমাকে কে বানিয়েছে? Who made you?"))  # Counts Bangla chars
```

### API Still Called for Creator Questions

**Issue**: Creator question should be answered without API, but API is called

**Solution**: Ensure `is_creator_question()` returns True

```python
# Debug: Verify detection
message = "Who created you?"
print(is_creator_question(message))  # Should be True
```

---

## Future Enhancements

1. **Extended Patterns**: Add more question variations
2. **Context Awareness**: Consider conversation history
3. **Personalization**: Different responses for different users
4. **Analytics**: Track which questions are asked most
5. **Feedback Loop**: Learn new patterns from user interactions
6. **Multi-language**: Support more languages beyond English/Bangla
7. **Dynamic Responses**: Vary responses while maintaining consistency

---

## Summary

The Nova AI Identity System provides:

✅ Professional AI identity management
✅ Creator information tracking
✅ Multilingual support (English/Bangla)
✅ Optimized response handling
✅ API cost and latency reduction
✅ Clean, maintainable code
✅ Seamless integration with existing system
✅ Comprehensive logging and debugging

**The AI now has a professional identity and can accurately represent its creator!**
