# Quick Start - 5 Minutes to Running Chat API

## Step 1: Install Dependencies (1 min)

```bash
pip install -r requirements.txt
```

## Step 2: Configure .env (1 min)

Create `.env` file:

```env
OPENAI_API_KEY=sk_test_your_key_here
```

That's it! Other values have defaults.

## Step 3: Start Server (1 min)

```bash
uvicorn src.main:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## Step 4: Test Health (1 min)

```bash
curl http://localhost:8000/v1/health
```

Response:
```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

## Step 5: Send a Message (1 min)

```bash
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello! How are you?",
    "conversation_id": "user_123"
  }'
```

Response:
```json
{
  "reply": "Hello! I'm doing well, thank you for asking. How can I help you today?",
  "conversation_id": "user_123"
}
```

## How It Works

1. **First message** - AI responds based on system prompt
2. **Next message with same conversation_id** - AI remembers previous context
3. **Reset** - Clear conversation history

### Multi-turn Conversation

```bash
# Message 1
curl -X POST http://localhost:8000/v1/chat \
  -d '{"message": "What is 2+2?", "conversation_id": "math"}' | jq '.reply'
# "The answer is 4"

# Message 2 (AI remembers context)
curl -X POST http://localhost:8000/v1/chat \
  -d '{"message": "Double that", "conversation_id": "math"}' | jq '.reply'
# "Double 4 is 8"

# Reset conversation
curl -X POST http://localhost:8000/v1/reset \
  -d '{"conversation_id": "math"}' | jq '.'
# {"ok": true, "conversation_id": "math"}
```

## Python Example

```python
import httpx
import asyncio
import json

async def main():
    async with httpx.AsyncClient() as client:
        # Chat
        response = await client.post(
            "http://localhost:8000/v1/chat",
            json={
                "message": "What is the capital of France?",
                "conversation_id": "user_123"
            }
        )
        data = response.json()
        print(f"AI: {data['reply']}")

        # Health check
        health = await client.get("http://localhost:8000/v1/health")
        print(f"Status: {health.json()['status']}")

asyncio.run(main())
```

## JavaScript Example

```javascript
const API_URL = 'http://localhost:8000/v1/chat';

async function chat(message, conversationId) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message,
            conversation_id: conversationId
        })
    });

    const data = await response.json();
    console.log(`AI: ${data.reply}`);
    return data;
}

// Usage
chat("Hello!", "user_123");
```

## Project Structure

```
src/
├── main.py                  ← FastAPI app
├── config.py               ← Configuration
├── schemas/
│   └── chat.py            ← Request/response models
├── services/
│   ├── openai_service.py  ← OpenAI wrapper
│   └── memory_service.py  ← Conversation storage
└── routers/
    └── chat.py            ← API endpoints
```

## Key Concepts

### 1. Conversation Memory
- Stores last **10 messages** per conversation_id
- In-memory (can add database later)
- Automatically included in OpenAI request

### 2. Async Architecture
- Non-blocking I/O
- Handles many concurrent requests
- Fast startup/shutdown

### 3. Error Handling
- 400 → Empty message
- 401 → Auth failed
- 429 → Rate limited
- 500 → Server error

## Common Tasks

### Increase Message History

Edit `src/services/memory_service.py`:

```python
MAX_HISTORY_SIZE = 20  # Was 10
```

### Change OpenAI Model

Edit `.env`:

```env
OPENAI_MODEL=gpt-4-turbo  # Was gpt-4.1-mini
```

### Adjust Temperature (Randomness)

Edit `.env`:

```env
OPENAI_TEMPERATURE=1.5  # Higher = more random (0.7 default)
```

### Change System Prompt

Edit `src/services/openai_service.py`:

```python
SYSTEM_PROMPT = "You are a helpful pirate assistant!"  # Custom prompt
```

## Troubleshooting

**Error: OPENAI_API_KEY not found**
```
Solution: Add OPENAI_API_KEY to .env
```

**Error: Port 8000 already in use**
```bash
# Use different port
uvicorn src.main:app --port 8001
```

**Error: Module not found**
```bash
# Install dependencies
pip install -r requirements.txt
```

**Slow responses (>5s)**
```
Check OpenAI API status page
May need to upgrade API plan
```

## Next Steps

1. Read `PRODUCTION_READY.md` for full overview
2. Read `API.md` for all endpoints
3. Read `SETUP.md` for detailed setup

## Production Deployment

For production, update `.env`:

```env
OPENAI_API_KEY=sk_live_your_production_key
ENVIRONMENT=production
LOG_LEVEL=WARNING
DEBUG=false
```

Then run with gunicorn:

```bash
gunicorn -w 4 -k uvicorn.workers.UvicornWorker src.main:app --bind 0.0.0.0:8000
```

---

**You're done! 🎉**

The AI chat API is ready to use. Send messages, get responses, manage conversations.

Ask questions → Get intelligent replies → Build with AI!
