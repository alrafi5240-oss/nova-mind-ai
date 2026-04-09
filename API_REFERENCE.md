# NOVA MIND AI - API Reference

## Base URL

```
http://your-domain.com
```

All endpoints use HTTPS in production.

---

## Authentication

All endpoints except `/api/users/register` and `/api/users/login` require authentication via one of:

**Header 1: X-API-Key**
```
X-API-Key: your_32_char_api_key
```

**Header 2: Authorization Bearer**
```
Authorization: Bearer your_32_char_api_key
```

---

## User Endpoints

### POST /api/users/register

Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123"
}
```

**Response 201:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "username": "username",
  "api_key": "550e8400e29b41d4a716446655440000",
  "message": "Registration successful"
}
```

**Response 400:**
```json
{
  "detail": "Email already registered"
}
```

---

### POST /api/users/login

Authenticate user and get API key.

**Request:**
```json
{
  "email_or_username": "user@example.com",
  "password": "password123"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Login successful",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "api_key": "550e8400e29b41d4a716446655440000"
}
```

**Response 401:**
```json
{
  "detail": "Invalid credentials"
}
```

---

### GET /api/users/profile

Get current user's profile and usage information.

**Headers:**
```
X-API-Key: your_api_key
```

**Response 200:**
```json
{
  "user": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "username",
    "plan": "free",
    "is_active": true,
    "daily_message_limit": 10,
    "is_premium": false,
    "created_at": "2026-04-06T10:30:00",
    "updated_at": "2026-04-06T10:30:00",
    "metadata": {}
  },
  "subscription": null,
  "usage_today": 5,
  "usage_limit": 10
}
```

---

### POST /api/users/rotate-key

Generate a new API key (old key becomes invalid).

**Headers:**
```
X-API-Key: your_api_key
```

**Response 200:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "api_key": "new_32_char_api_key_here",
  "message": "New API key generated. The old key is no longer valid."
}
```

---

### POST /api/users/change-plan

Change user's subscription plan.

**Headers:**
```
X-API-Key: your_api_key
```

**Request:**
```json
{
  "plan": "pro"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Plan changed to pro",
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Valid Plans:**
- `free` - 10 messages/day
- `basic` - 500 messages/day ($5/month)
- `pro` - 5,000 messages/day ($20/month)
- `elite` - Unlimited (-1)

---

## Chat Endpoints

### POST /v1/chat

Send a message and get a response (requires API key).

**Headers:**
```
X-API-Key: your_api_key
Content-Type: application/json
```

**Request:**
```json
{
  "message": "Hello, who are you?",
  "conversation_id": "default"
}
```

**Response 200:**
```json
{
  "reply": "Hello! I'm NOVA MIND AI, created by SHAKIL..."
}
```

**Response 401:**
```json
{
  "detail": "Invalid or missing API key"
}
```

**Response 429 (Quota Exceeded):**
```json
{
  "error": "rate_limited",
  "detail": "Daily limit reached (10 messages). Upgrade your plan..."
}
```

**Response 503 (Service Unavailable):**
```json
{
  "error": "service_unavailable",
  "detail": "OpenAI API key not configured..."
}
```

**Parameters:**
- `message` (string, required): The user's message (1-10,000 chars)
- `conversation_id` (string, optional): Conversation context (default: "default")

---

### POST /v2/chat

Same as /v1/chat but may use different OpenAI model (gpt-4o).

**Request & Response:**
Same as `/v1/chat`

---

## Admin Endpoints

All admin endpoints require:
```
X-Admin-Token: your_admin_token
```

### GET /admin/users

List all users with pagination.

**Query Parameters:**
- `page` (int, optional): Page number (default: 1)
- `per_page` (int, optional): Items per page (default: 20, max: 100)

**Response 200:**
```json
{
  "users": [
    {
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "username": "username",
      "plan": "free",
      "is_active": true,
      "created_at": "2026-04-06T10:30:00",
      "usage_today": 5
    }
  ],
  "total": 42,
  "page": 1,
  "per_page": 20
}
```

---

### GET /admin/users/{user_id}

Get detailed information about a specific user.

**Response 200:**
```json
{
  "user": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "username",
    "plan": "free",
    "is_active": true,
    "created_at": "2026-04-06T10:30:00",
    "updated_at": "2026-04-06T10:30:00"
  },
  "usage_today": 5,
  "usage_limit": 10
}
```

---

### PUT /admin/users/{user_id}/plan

Change a user's subscription plan.

**Request:**
```json
{
  "plan": "pro",
  "reason": "Special promotional offer"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Plan changed to pro",
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### POST /admin/users/{user_id}/activate

Activate (reactivate) a suspended user.

**Response 200:**
```json
{
  "success": true,
  "message": "User activated",
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### POST /admin/users/{user_id}/suspend

Suspend a user (block access to API).

**Response 200:**
```json
{
  "success": true,
  "message": "User suspended",
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### DELETE /admin/users/{user_id}

Soft-delete a user (marks as inactive, preserves data).

**Response 200:**
```json
{
  "success": true,
  "message": "User deleted",
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### GET /admin/usage

Get system-wide usage statistics.

**Query Parameters:**
- `target_date` (string, optional): Date in YYYY-MM-DD format

**Response 200:**
```json
{
  "date": "2026-04-06",
  "message": "Use /admin/usage/{user_id} for specific user usage"
}
```

---

### GET /admin/usage/{user_id}

Get usage statistics for a specific user.

**Query Parameters:**
- `days` (int, optional): Number of days to retrieve (1-365, default: 7)

**Response 200:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "days": 7,
  "usage": [
    {
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "date": "2026-04-06",
      "message_count": 8,
      "tokens_used": 2500
    },
    {
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "date": "2026-04-05",
      "message_count": 10,
      "tokens_used": 3200
    }
  ]
}
```

---

### GET /admin/payments

List all payments.

**Query Parameters:**
- `page` (int, optional): Page number (default: 1)
- `per_page` (int, optional): Items per page (default: 20)
- `status` (string, optional): Filter by status (pending, completed, failed, refunded)

**Response 200:**
```json
{
  "payments": [
    {
      "payment_id": "pay-550e8400",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "amount_usd": 5.0,
      "currency": "USD",
      "method": "stripe",
      "status": "completed",
      "created_at": "2026-04-06T10:30:00",
      "plan": "basic"
    }
  ],
  "total": 15,
  "total_revenue": 75.0
}
```

---

### GET /admin/stats

Get system-wide statistics.

**Response 200:**
```json
{
  "total_users": 42,
  "premium_users": 12,
  "free_users": 30,
  "active_users": 35,
  "total_messages_today": 1250,
  "total_revenue_usd": 850.0,
  "active_subscriptions": 12
}
```

---

## System Endpoints

### GET /

Root endpoint - API status.

**Response 200:**
```json
{
  "status": "ok",
  "service": "Nova Mind AI",
  "backend_version": "1.0.0",
  "api": {
    "v1": "/v1/chat, /v1/voice/transcribe, /v1/app/config",
    "v2": "/v2/chat, /v2/voice/transcribe, /v2/app/config",
    "legacy": "/chat, /voice/transcribe (v1 behavior)"
  }
}
```

---

### GET /v1/health

Health check endpoint.

**Response 200:**
```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "error_code",
  "detail": "Human-readable error message"
}
```

### Common Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| invalid_request | 400 | Bad request (validation error) |
| authentication_failed | 401 | Invalid credentials |
| unauthorized | 401 | Missing/invalid API key |
| rate_limited | 429 | Quota or rate limit exceeded |
| service_unavailable | 503 | Service temporarily unavailable |
| internal_error | 500 | Server error |

---

## Rate Limiting

### Global Rate Limit

**60 requests per 60 seconds per IP**

Response headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1712426430
```

### User Quotas

Per-plan daily message limits:

| Plan | Limit |
|------|-------|
| Free | 10 messages/day |
| Basic | 500 messages/day |
| Pro | 5,000 messages/day |
| Elite | Unlimited |

Resets at **UTC midnight (00:00 UTC)**.

---

## Examples

### cURL

```bash
# Register
curl -X POST http://your-domain.com/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "user",
    "password": "pass123"
  }'

# Chat
curl -X POST http://your-domain.com/v1/chat \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'

# Admin
curl -X GET http://your-domain.com/admin/stats \
  -H "X-Admin-Token: admin_token"
```

### Python

```python
import requests

# Register
resp = requests.post(
    "http://your-domain.com/api/users/register",
    json={
        "email": "user@example.com",
        "username": "user",
        "password": "pass123"
    }
)
api_key = resp.json()["api_key"]

# Chat
resp = requests.post(
    "http://your-domain.com/v1/chat",
    headers={"X-API-Key": api_key},
    json={"message": "Hello!"}
)
print(resp.json()["reply"])
```

### JavaScript

```javascript
// Register
const registerResp = await fetch("http://your-domain.com/api/users/register", {
  method: "POST",
  headers: {"Content-Type": "application/json"},
  body: JSON.stringify({
    email: "user@example.com",
    username: "user",
    password: "pass123"
  })
});
const apiKey = (await registerResp.json()).api_key;

// Chat
const chatResp = await fetch("http://your-domain.com/v1/chat", {
  method: "POST",
  headers: {
    "X-API-Key": apiKey,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({message: "Hello!"})
});
const reply = (await chatResp.json()).reply;
console.log(reply);
```

---

## Versioning

The API uses version prefixes:

- `/v1/` - Stable (current production)
- `/v2/` - Future/experimental

Legacy endpoints without version prefix (`/chat`, `/voice/transcribe`) use v1 behavior.

---

## Webhooks (Future)

Payment providers will support webhooks:

- Stripe: `POST /webhooks/stripe`
- bKash: `POST /webhooks/bkash`
- Nagad: `POST /webhooks/nagad`
- Crypto: `POST /webhooks/crypto`

(Currently structure only - implement as needed)

---

## Rate Limits Summary

| Endpoint | Limit | Notes |
|----------|-------|-------|
| All endpoints | 60/min per IP | Global limit |
| /v1/chat | Per-plan daily | Free: 10, Basic: 500, Pro: 5000, Elite: ∞ |
| /api/users/register | None | Unlimited registration |
| /admin/* | None | No limit for admin |

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
| 502 | Bad Gateway |
| 503 | Service Unavailable |

---

## Support

For API issues:
- 📧 Email: api-support@example.com
- 📚 Documentation: See `SAAS_SYSTEM.md`
- 🐛 Report bugs: GitHub issues

**API Documentation Complete!** 🚀
