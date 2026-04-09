# Nova Mind AI - Production Chat API

## Overview

Production-ready AI chat backend with conversation memory, error handling, and comprehensive logging.

## Features

✅ **Conversation Memory** - Last 10 messages per conversation_id
✅ **OpenAI Integration** - GPT-4.1-mini with temperature 0.7
✅ **Error Handling** - Proper HTTP status codes
✅ **Async/Await** - Fully asynchronous architecture
✅ **Logging** - Comprehensive request/response logging
✅ **Health Check** - Service status endpoint
✅ **Clean Architecture** - Modular, maintainable code

## Endpoints

### Health Check

**GET** `/v1/health`

Check service status.

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

### Chat

**POST** `/v1/chat`

Send a message and get AI response with conversation context.

**Request:**
```json
{
  "message": "Hello, how are you?",
  "conversation_id": "user_123"
}
```

**Response (200):**
```json
{
  "reply": "I'm doing well, thank you for asking! How can I help you?",
  "conversation_id": "user_123"
}
```

**Error Responses:**
- **400** - Empty message
- **401** - OpenAI authentication failed
- **429** - Rate limited
- **500** - Server error

### Reset Conversation

**POST** `/v1/reset`

Clear conversation history.

**Request:**
```json
{
  "conversation_id": "user_123"
}
```

**Response (200):**
```json
{
  "ok": true,
  "conversation_id": "user_123"
}
```

## File Structure

```
src/
├── main.py                    # FastAPI app initialization
├── config.py                  # Configuration management
│
├── schemas/
│   └── chat.py               # Pydantic request/response models
│
├── services/
│   ├── openai_service.py     # OpenAI API wrapper
│   ├── memory_service.py     # Conversation memory storage
│   └── ...
│
├── routers/
│   ├── chat.py               # Chat endpoints
│   └── ...
│
├── middleware/
│   └── request_log.py        # Request logging middleware
│
└── deps.py                   # Dependency injection
```

## Configuration

Environment variables in `.env`:

```env
# Server
HOST=0.0.0.0
PORT=8000
DEBUG=false
ENVIRONMENT=production
LOG_LEVEL=INFO

# OpenAI
OPENAI_API_KEY=sk_...
OPENAI_MODEL=gpt-4.1-mini
OPENAI_TEMPERATURE=0.7

# Backend
BACKEND_VERSION=1.0.0
```

## Usage Examples

### Python

```python
import httpx
import asyncio

async def chat():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/v1/chat",
            json={
                "message": "What is the capital of France?",
                "conversation_id": "user_123"
            }
        )
        data = response.json()
        print(data["reply"])

asyncio.run(chat())
```

### cURL

```bash
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the capital of France?",
    "conversation_id": "user_123"
  }'
```

### JavaScript/Fetch

```javascript
const response = await fetch('http://localhost:8000/v1/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'What is the capital of France?',
    conversation_id: 'user_123'
  })
});

const data = await response.json();
console.log(data.reply);
```

## Architecture

### Memory Service

In-memory conversation storage with thread-safe operations:

- **10 messages** per conversation_id
- **FIFO queue** - oldest messages removed when limit reached
- **Thread-safe** - Lock-based per conversation
- **Fast** - O(1) append, O(n) retrieval

### OpenAI Service

Wrapper around OpenAI API:

- Handles authentication, rate limiting, network errors
- Manages conversation context (system prompt + history + user message)
- Persists exchanges to memory automatically
- Logs all interactions

### Chat Router

FastAPI endpoint handlers:

- Input validation (non-empty messages)
- Error handling with proper HTTP codes
- Dependency injection for services
- Structured logging

## Error Handling

| Status | Reason | Detail |
|--------|--------|--------|
| 400 | Empty message | "Message cannot be empty" |
| 401 | Auth failed | "Authentication failed with OpenAI API" |
| 429 | Rate limited | "Rate limit exceeded. Please try again later." |
| 500 | Server error | "Internal server error" |
| 503 | Service unavailable | Connection/API issues |

## Performance

- **Async/await** - Non-blocking I/O
- **Memory efficient** - Limited to last 10 messages per conversation
- **Fast startup** - Minimal initialization
- **Scalable** - Ready for database backend

## Logging

All requests and responses are logged with:

- Timestamp
- Log level (DEBUG, INFO, WARNING, ERROR)
- Logger name
- Message content

Example:
```
2024-01-15 10:23:45,123 [INFO] nova.router.chat: Chat request: conversation_id=user_123, message_length=42
2024-01-15 10:23:46,456 [INFO] nova.router.chat: Chat response: conversation_id=user_123, reply_length=85
```

## Next Steps

Potential enhancements:

1. **Database Persistence** - Store conversations in MongoDB/PostgreSQL
2. **Authentication** - JWT tokens, API keys
3. **Rate Limiting** - Per-user/IP limits
4. **Caching** - Redis for frequent queries
5. **Analytics** - Track usage patterns
6. **Webhooks** - Event notifications
7. **Streaming** - Server-sent events for live responses
8. **Multiple Models** - Support Claude, Gemini, etc.
