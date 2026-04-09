# Setup Guide - Nova Mind AI Production Backend

## Quick Start

### 1. Install Dependencies

```bash
pip install fastapi uvicorn openai python-dotenv pydantic
```

Or use the requirements.txt:

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Create `.env` in the backend root:

```env
# Required
OPENAI_API_KEY=sk_test_your_key_here

# Optional (with defaults)
OPENAI_MODEL=gpt-4.1-mini
OPENAI_TEMPERATURE=0.7
BACKEND_VERSION=1.0.0
LOG_LEVEL=INFO
DEBUG=false
ENVIRONMENT=production
HOST=0.0.0.0
PORT=8000
```

### 3. Run the Server

```bash
# Development (with auto-reload)
uvicorn src.main:app --reload

# Production
uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 4. Test the API

Health check:
```bash
curl http://localhost:8000/v1/health
```

Chat endpoint:
```bash
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello!",
    "conversation_id": "test_user"
  }'
```

Reset conversation:
```bash
curl -X POST http://localhost:8000/v1/reset \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "test_user"
  }'
```

## Project Structure

```
nova-mind-backend/
├── src/
│   ├── __init__.py
│   ├── main.py                           # FastAPI app
│   ├── config.py                         # Configuration
│   ├── deps.py                           # Dependency injection
│   ├── settings.py                       # Settings helper
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── chat.py                       # Pydantic models
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── openai_service.py             # OpenAI wrapper
│   │   ├── memory_service.py             # Conversation memory
│   │   ├── assistant.py                  # (existing)
│   │   ├── memory.py                     # (existing)
│   │   └── voice.py                      # (existing)
│   │
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── chat.py                       # Chat endpoints (NEW)
│   │   └── versioned.py                  # (existing v1/v2)
│   │
│   ├── middleware/
│   │   ├── __init__.py
│   │   └── request_log.py                # Logging middleware
│   │
│   └── ... (other existing files)
│
├── .env                                  # Environment variables
├── .env.example                          # Template
├── requirements.txt                      # Dependencies
├── API.md                                # API Documentation
├── SETUP.md                              # This file
└── README.md                             # Project README
```

## Key Components

### 1. Configuration (`src/config.py`)

Centralized configuration management:

```python
from src.config import Config

print(Config.OPENAI_API_KEY)    # From .env
print(Config.OPENAI_MODEL)      # Default: gpt-4.1-mini
print(Config.BACKEND_VERSION)   # Default: 1.0.0
```

### 2. Memory Service (`src/services/memory_service.py`)

In-memory conversation storage:

```python
from src.services.memory_service import get_conversation_memory

memory = get_conversation_memory()

# Get conversation history
history = memory.get_history("user_123")

# Add exchange
memory.add_exchange("user_123", "Hello", "Hi there!")

# Clear conversation
memory.clear_conversation("user_123")
```

### 3. OpenAI Service (`src/services/openai_service.py`)

OpenAI API wrapper:

```python
from src.services.openai_service import get_openai_service
from openai import AsyncOpenAI

service = get_openai_service()

# Send chat message
reply = await service.chat(
    message="Hello!",
    conversation_id="user_123"
)

# Get history
history = service.get_history("user_123")

# Clear conversation
service.clear_conversation("user_123")
```

### 4. Chat Router (`src/routers/chat.py`)

FastAPI endpoints:

```
POST /v1/chat           → Send message
POST /v1/reset          → Clear conversation
GET  /v1/health         → Health check
```

## Testing

### Unit Testing Example

```python
import pytest
from httpx import AsyncClient
from src.main import app

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/v1/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

@pytest.mark.asyncio
async def test_chat():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/v1/chat", json={
            "message": "Hello",
            "conversation_id": "test"
        })
        assert response.status_code == 200
        data = response.json()
        assert "reply" in data
        assert data["conversation_id"] == "test"
```

### Integration Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest tests/ -v
```

## Deployment

### Docker

Create `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:

```bash
docker build -t nova-mind-api .
docker run -p 8000:8000 --env-file .env nova-mind-api
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ENVIRONMENT=production
      - LOG_LEVEL=INFO
    restart: unless-stopped
```

Run:

```bash
docker-compose up -d
```

## Monitoring

### Check Logs

```bash
# Follow logs
tail -f logs/app.log

# Search for errors
grep ERROR logs/app.log

# Count requests
grep "Chat request" logs/app.log | wc -l
```

### Health Monitoring

```bash
# Health check loop
watch -n 5 'curl -s http://localhost:8000/v1/health | jq'
```

## Performance Tuning

### Uvicorn Workers

```bash
# Production: 4 workers (2x CPU cores)
uvicorn src.main:app --workers 4

# Adjust based on: CPU cores, memory, traffic
```

### Connection Pooling

The OpenAI client uses connection pooling by default. Adjust if needed:

```python
from openai import AsyncOpenAI

client = AsyncOpenAI(
    api_key=api_key,
    timeout=30.0,  # Request timeout
    max_retries=2,  # Retry failed requests
)
```

## Troubleshooting

### OpenAI API Key Not Found

```
ERROR: OPENAI_API_KEY environment variable is required
```

**Solution:** Add to `.env`:
```env
OPENAI_API_KEY=sk_test_...
```

### Rate Limited (429)

```
HTTPException: Rate limit exceeded. Please try again later.
```

**Solution:** Implement backoff retry logic or increase delays between requests.

### Memory Issues

If conversations are very large:

1. Reduce `MAX_HISTORY_SIZE` in `memory_service.py`
2. Implement database persistence
3. Add automatic conversation archiving

## Security Checklist

- [ ] Never commit `.env` with real API keys
- [ ] Use environment variables in production
- [ ] Implement authentication (JWT, API keys)
- [ ] Add rate limiting
- [ ] Use HTTPS in production
- [ ] Validate and sanitize inputs
- [ ] Log errors without exposing sensitive data
- [ ] Implement request signing

## Next Steps

1. **Add Database** - Replace in-memory storage with PostgreSQL/MongoDB
2. **Authentication** - JWT tokens for user authentication
3. **Rate Limiting** - Implement per-user/IP rate limits
4. **Caching** - Redis for conversation caching
5. **Streaming** - Server-sent events for live responses
6. **Monitoring** - Prometheus metrics, Sentry error tracking
7. **CI/CD** - GitHub Actions for testing and deployment
