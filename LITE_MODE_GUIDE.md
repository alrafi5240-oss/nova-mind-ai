# Lite Mode Guide - NOVA MIND AI

## Overview

Lite Mode is a fallback mechanism that allows the NOVA MIND AI backend to operate without an OpenAI API key. This is useful for:
- Development and testing without OpenAI costs
- Graceful degradation when OpenAI is unavailable
- Testing chat infrastructure without external API dependencies

---

## How It Works

### Control Flow

1. **Provider Check**: System checks the `LLM_PROVIDER` environment variable
2. **Lite Mode Enabled**: If `LLM_PROVIDER=lite`, always use simple responses (no API call)
3. **OpenAI Mode (Default)**: If `LLM_PROVIDER=openai`:
   - Tries to use OpenAI API
   - **Falls back to lite mode** if OPENAI_API_KEY is missing
   - Returns error only if OpenAI connection fails, not for missing key

### Key Improvement

**Before**: Missing `OPENAI_API_KEY` returned 503 Service Unavailable error
**After**: Missing `OPENAI_API_KEY` gracefully falls back to lite mode responses

---

## Usage

### Option 1: Explicit Lite Mode

```bash
# Run in lite mode (no OpenAI needed)
export LLM_PROVIDER=lite
uvicorn src.main:app --reload
```

Test it:
```bash
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, who are you?"}'

# Response:
# {"reply": "[Lite Mode] I received your message: 'Hello, who are you?' (ID: default)"}
```

### Option 2: OpenAI Mode with Lite Fallback

```bash
# No OPENAI_API_KEY set (lite mode as fallback)
export LLM_PROVIDER=openai
# DO NOT SET OPENAI_API_KEY

uvicorn src.main:app --reload
```

Test it:
```bash
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'

# Response (falls back to lite mode):
# {"reply": "[Lite Mode] I received your message: 'Hello!' (ID: default)"}

# Logs show:
# WARNING - OpenAI client unavailable, falling back to lite mode.
```

### Option 3: OpenAI Mode (Production)

```bash
# Full OpenAI integration
export OPENAI_API_KEY=sk_...
export LLM_PROVIDER=openai

uvicorn src.main:app
```

---

## Configuration

### Environment Variables

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `LLM_PROVIDER` | `openai` or `lite` | `openai` | Which LLM to use |
| `OPENAI_API_KEY` | `sk_...` | Not set | OpenAI API key (required for OpenAI mode) |

### .env Example

```env
# Lite mode
LLM_PROVIDER=lite

# Or OpenAI mode with fallback
LLM_PROVIDER=openai
OPENAI_API_KEY=sk_your_key_here
```

---

## Lite Mode Response Format

When in lite mode, responses follow this format:

```
[Lite Mode] I received your message: '<first 100 chars>' (ID: <conv_id>)
```

### Examples

| User Input | Lite Response |
|-----------|--------------|
| "Hello" | `[Lite Mode] I received your message: 'Hello' (ID: default)` |
| "Who created you?" | `[Lite Mode] I received your message: 'Who created you?' (ID: convo123)` |
| "This is a very long message that exceeds..." | `[Lite Mode] I received your message: 'This is a very long message that exceeds...' (ID: ...)` |

---

## Conversation Memory

Even in lite mode:
- Messages are stored in conversation history
- You can retrieve history with GET endpoints
- You can reset conversations with POST `/conversation/reset`
- All conversation features work normally

---

## Error Handling

### Scenario 1: Missing API Key (OpenAI Mode)
```
Request: POST /v1/chat with no OPENAI_API_KEY set
LLM_PROVIDER: openai
Response: 200 OK with lite mode response
Behavior: Gracefully falls back
```

### Scenario 2: Invalid API Key
```
Request: POST /v1/chat with invalid OPENAI_API_KEY
Response: 401 Authentication Failed
Behavior: Error (not fallback) because client is initialized but invalid
```

### Scenario 3: OpenAI Connection Error
```
Request: POST /v1/chat while OpenAI is down
Response: 503 Upstream Unreachable
Behavior: Error (not fallback) because it's a service issue
```

---

## Use Cases

### Development

```bash
# Quick local testing without costs
LLM_PROVIDER=lite uvicorn src.main:app --reload
```

### Testing Infrastructure

```bash
# Test chat endpoints, middleware, authentication, rate limiting
# without external API calls
LLM_PROVIDER=lite pytest tests/
```

### Graceful Degradation

```bash
# Set to openai - if API key is missing, still serve responses
# Don't block users with 503 errors
LLM_PROVIDER=openai
# OPENAI_API_KEY= (missing - falls back to lite)
```

### Demo/Preview

```bash
# Show API in action without using OpenAI quota
LLM_PROVIDER=lite export DEMO_MODE=1
```

---

## Docker Deployment

### With Lite Mode

```dockerfile
# In docker-compose.yml or Dockerfile
ENV LLM_PROVIDER=lite
```

### With OpenAI and Fallback

```dockerfile
ENV LLM_PROVIDER=openai
# OPENAI_API_KEY passed at runtime
```

---

## Migration Guide

### From Hardcoded to Lite Mode

**Before** (rejected users):
```
Missing OPENAI_API_KEY → 503 Service Unavailable
```

**After** (serves responses):
```
Missing OPENAI_API_KEY + LLM_PROVIDER=openai → Lite mode response
```

---

## Logging

Lite mode includes detailed logging:

```
INFO:     lite_mode_reply conversation_id=default user_chars=13
WARNING:  OpenAI client unavailable, falling back to lite mode. Set OPENAI_API_KEY to enable full AI responses.
```

---

## API Compatibility

All chat endpoints work identically in lite and OpenAI modes:
- ✅ POST /chat
- ✅ POST /v1/chat
- ✅ POST /v2/chat
- ✅ POST /conversation/reset
- ✅ GET /v1/health

Clients don't need to know which mode is active.

---

## Performance

### Lite Mode
- Response time: <10ms (no external API)
- Cost: $0
- Use case: Testing, development, demos

### OpenAI Mode
- Response time: 500-2000ms (API dependent)
- Cost: Per OpenAI token usage
- Use case: Production, end users

---

## Future Enhancements

Potential improvements to lite mode:
- [ ] Add simple regex-based rules for common questions
- [ ] Integrate alternative LLM providers (Hugging Face, Cohere, Anthropic)
- [ ] Caching of common responses
- [ ] Local lightweight model integration

---

## Troubleshooting

### Q: Why is my response `[Lite Mode]` when I set OPENAI_API_KEY?

**A**: Check that `OPENAI_API_KEY` is properly exported:
```bash
export OPENAI_API_KEY=sk_...
echo $OPENAI_API_KEY  # Should show the key
```

### Q: How do I switch from lite to OpenAI mode?

**A**: Set the environment variable and restart:
```bash
export OPENAI_API_KEY=sk_...
export LLM_PROVIDER=openai
# Restart the server
```

### Q: Does lite mode support conversation history?

**A**: Yes! Messages are stored and retrieved normally in lite mode.

### Q: Can I use lite mode in production?

**A**: Lite mode is intended for development/testing. For production, use OpenAI mode with a valid API key.

---

## Related Files

- `src/routers/versioned.py` - Chat endpoint logic with lite mode support
- `src/feature_flags.py` - Feature flag configuration including LLM_PROVIDER
- `src/services/memory.py` - Conversation history storage (works in both modes)
- `.env.example` - Configuration template

---

## Summary

Lite Mode provides a graceful fallback mechanism that:
- ✅ Eliminates 503 errors for missing API keys
- ✅ Enables development without OpenAI costs
- ✅ Maintains full conversation history
- ✅ Supports all existing chat features
- ✅ Improves user experience with better error handling

**Use `LLM_PROVIDER=lite` for development and testing, `LLM_PROVIDER=openai` for production!**
