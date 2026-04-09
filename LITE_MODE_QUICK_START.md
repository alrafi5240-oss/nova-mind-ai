# Lite Mode - Quick Start (5 Minutes)

## What is Lite Mode?

Lite mode lets you run NOVA MIND AI without OpenAI API key. Perfect for:
- Local development
- Testing infrastructure
- Demos without API costs
- Fallback when API is unavailable

---

## Quick Setup

### Option 1: Lite Mode Only (Fastest)

```bash
# Set environment variable
export LLM_PROVIDER=lite

# Start server
uvicorn src.main:app --reload

# Test it
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'

# You'll get:
# {"reply": "[Lite Mode] I received your message: 'Hello!' (ID: default)"}
```

### Option 2: OpenAI with Lite Fallback (Recommended)

```bash
# Set to openai (falls back to lite if key is missing)
export LLM_PROVIDER=openai
# OPTIONAL: Set if you have API key
# export OPENAI_API_KEY=sk_...

# Start server
uvicorn src.main:app --reload

# Works with or without API key!
```

### Option 3: Docker

```bash
# Edit docker-compose.yml and add:
# environment:
#   - LLM_PROVIDER=lite

# Or via command line:
docker-compose up -e LLM_PROVIDER=lite
```

---

## Testing

### Test Lite Mode Endpoint

```bash
# Simple test
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Who are you?"}'
```

### With cURL (Pretty Print)

```bash
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Test"}' | python -m json.tool
```

### With Python

```python
import requests

response = requests.post(
    "http://localhost:8000/v1/chat",
    json={"message": "Hello!"}
)
print(response.json())
```

### With JavaScript

```javascript
const response = await fetch('http://localhost:8000/v1/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello!' })
});
const data = await response.json();
console.log(data.reply);
```

---

## Configuration Reference

```env
# In .env file:

# Option 1: Lite mode (no API key needed)
LLM_PROVIDER=lite

# Option 2: OpenAI with fallback (recommended)
LLM_PROVIDER=openai
# OPENAI_API_KEY=sk_... (optional, falls back if missing)

# Option 3: OpenAI only (requires key)
LLM_PROVIDER=openai
OPENAI_API_KEY=sk_abc123...
```

---

## What You Get

### Lite Mode Response

```json
{
  "reply": "[Lite Mode] I received your message: 'Hello, who are you?' (ID: default)"
}
```

### Features That Work

- ✅ Chat API endpoints
- ✅ Conversation history
- ✅ Reset conversations
- ✅ Health checks
- ✅ Rate limiting
- ✅ Authentication (if enabled)

### Features That Don't Work

- ❌ Advanced AI responses
- ❌ Knowledge base queries
- ❌ Complex reasoning

---

## Common Tasks

### Switch to OpenAI Mode

```bash
export OPENAI_API_KEY=sk_your_key
export LLM_PROVIDER=openai
# Restart server
```

### Test Conversation History

```bash
# Message 1
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "First message", "conversation_id": "chat1"}'

# Message 2
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Second message", "conversation_id": "chat1"}'

# Both are stored in history
```

### Reset Conversation

```bash
curl -X POST http://localhost:8000/conversation/reset \
  -H "Content-Type: application/json" \
  -d '{"conversation_id": "chat1"}'
```

### Check API Health

```bash
curl http://localhost:8000/v1/health
# {"status":"ok","version":"..."}
```

---

## Performance

| Aspect | Lite Mode | OpenAI Mode |
|--------|-----------|-------------|
| Response Time | <10ms | 500-2000ms |
| API Cost | $0 | Per usage |
| Best For | Development | Production |

---

## Troubleshooting

### Server won't start

```bash
# Check Python version (need 3.9+)
python --version

# Check dependencies
pip install -r requirements.txt

# Check port (default 8000)
lsof -i :8000
```

### Getting 503 error

```bash
# This shouldn't happen with lite mode, but if it does:

# 1. Check LLM_PROVIDER is set
echo $LLM_PROVIDER

# 2. Restart server after setting
export LLM_PROVIDER=lite
uvicorn src.main:app --reload
```

### API key not working

```bash
# Verify key is set
echo $OPENAI_API_KEY

# If empty, set it:
export OPENAI_API_KEY=sk_your_actual_key

# Restart server
```

---

## Next Steps

1. **Start with lite mode**: `LLM_PROVIDER=lite`
2. **Read full guide**: See `LITE_MODE_GUIDE.md`
3. **Add your API key**: When ready, set `OPENAI_API_KEY`
4. **Switch to OpenAI**: `LLM_PROVIDER=openai`

---

## Support

- **Full Guide**: `LITE_MODE_GUIDE.md`
- **Technical Details**: `LITE_MODE_IMPLEMENTATION.md`
- **Tests**: `test_lite_mode_example.py`
- **Overall Summary**: `LITE_MODE_SUMMARY.md`

---

## Example Session

```bash
# 1. Start with lite mode
export LLM_PROVIDER=lite
uvicorn src.main:app --reload
# Server running on http://localhost:8000

# 2. In another terminal, send test messages
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello NOVA"}'

# 3. You get back:
# {"reply": "[Lite Mode] I received your message: 'Hello NOVA' (ID: default)"}

# 4. Later, add API key to enable full AI
export OPENAI_API_KEY=sk_...
# Restart server...
# Now you get full OpenAI responses!

# 5. Or stay in lite mode for development
# It's always available as a fallback
```

---

## That's It! 🎉

You now have a working NOVA MIND AI API that:
- ✅ Runs locally without API costs
- ✅ Provides responses in lite mode
- ✅ Scales to full OpenAI when needed
- ✅ Gracefully handles missing API keys

**Happy coding!**
