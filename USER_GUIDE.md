# NOVA MIND AI - User Guide

## Getting Started

### 1. Create an Account

Visit the API endpoint or use your client:

```bash
curl -X POST http://your-domain.com/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "yourname@example.com",
    "username": "yourname",
    "password": "secure_password"
  }'
```

You'll receive an API key:
```json
{
  "user_id": "abc123...",
  "api_key": "your_32_char_api_key",
  "username": "yourname"
}
```

**Save your API key securely** - you'll need it to use NOVA MIND AI.

### 2. Login

Already have an account? Get a new API key:

```bash
curl -X POST http://your-domain.com/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email_or_username": "yourname",
    "password": "your_password"
  }'
```

---

## Using the Chat API

### Basic Chat Request

```bash
curl -X POST http://your-domain.com/v1/chat \
  -H "X-API-Key: your_32_char_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello NOVA MIND AI!",
    "conversation_id": "default"
  }'
```

### Response

```json
{
  "reply": "Hello! I'm NOVA MIND AI, created by SHAKIL..."
}
```

### Authentication Methods

Choose one:

**Option 1: X-API-Key Header**
```
X-API-Key: your_32_char_api_key
```

**Option 2: Bearer Token**
```
Authorization: Bearer your_32_char_api_key
```

---

## API Key Management

### View Your Profile

```bash
curl -X GET http://your-domain.com/api/users/profile \
  -H "X-API-Key: your_api_key"
```

### Rotate Your API Key

If your current key is compromised:

```bash
curl -X POST http://your-domain.com/api/users/rotate-key \
  -H "X-API-Key: your_api_key"
```

New key will be returned. The old key becomes invalid immediately.

---

## Understanding Your Plan

### Free Plan
- **Price**: FREE
- **Messages/Day**: 10
- **Best For**: Testing, small projects

### Basic Plan
- **Price**: $5/month
- **Messages/Day**: 500
- **Best For**: Startups, small applications

### Pro Plan
- **Price**: $20/month
- **Messages/Day**: 5,000
- **Best For**: Growing businesses

### Elite Plan
- **Price**: $150/month
- **Messages/Day**: Unlimited
- **Best For**: Enterprise, high-volume

### Check Your Current Plan

```bash
curl -X GET http://your-domain.com/api/users/profile \
  -H "X-API-Key: your_api_key"
```

Look for `usage_limit` - that's your daily message allowance.

---

## Message Limits & Quotas

### Daily Limit
- You get a maximum number of messages per day based on your plan
- Counter resets at **UTC midnight** (00:00 UTC)
- You'll get an error if you exceed the limit

### What Happens When You Hit the Limit

```json
{
  "error": "rate_limited",
  "detail": "Daily limit reached (10 messages). Upgrade your plan..."
}
```

Response status: **HTTP 429 Too Many Requests**

### Solutions
1. **Wait until tomorrow** - Counter resets at midnight UTC
2. **Upgrade your plan** - Get more messages per day
3. **Contact support** - For enterprise solutions

---

## Using Conversations

### Start a Conversation

Each conversation is identified by a `conversation_id`. The default is "default":

```bash
curl -X POST http://your-domain.com/v1/chat \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is machine learning?",
    "conversation_id": "my_conversation"
  }'
```

### Keep Conversation Context

All messages in the same `conversation_id` are kept in context:

```bash
# Message 1
curl -X POST http://your-domain.com/v1/chat \
  -H "X-API-Key: your_api_key" \
  -d '{
    "message": "My name is Alice",
    "conversation_id": "my_conversation"
  }'

# Message 2 - AI remembers your name
curl -X POST http://your-domain.com/v1/chat \
  -H "X-API-Key: your_api_key" \
  -d '{
    "message": "What's my name?",
    "conversation_id": "my_conversation"
  }'
```

---

## Programming Language Examples

### Python
```python
import requests

api_key = "your_32_char_api_key"
url = "http://your-domain.com/v1/chat"

headers = {
    "X-API-Key": api_key,
    "Content-Type": "application/json"
}

data = {
    "message": "Hello NOVA!",
    "conversation_id": "default"
}

response = requests.post(url, headers=headers, json=data)
print(response.json()["reply"])
```

### JavaScript
```javascript
const apiKey = "your_32_char_api_key";
const url = "http://your-domain.com/v1/chat";

const response = await fetch(url, {
  method: "POST",
  headers: {
    "X-API-Key": apiKey,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    message: "Hello NOVA!",
    conversation_id: "default"
  })
});

const data = await response.json();
console.log(data.reply);
```

### cURL
```bash
curl -X POST http://your-domain.com/v1/chat \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello NOVA!", "conversation_id": "default"}'
```

---

## Troubleshooting

### Error: "Invalid or missing API key"
- ✅ Check you set the X-API-Key or Authorization header
- ✅ Verify the API key is correct (copy-paste carefully)
- ✅ Make sure your account is still active
- ✅ Try logging in again to get a fresh key

### Error: "Daily limit reached"
- ✅ You've used all your messages for today
- ✅ Counter resets at midnight UTC
- ✅ Upgrade your plan for more messages

### Error: "User account is suspended"
- ✅ Your account has been suspended by admin
- ✅ Contact support for more information

### No Response / Timeout
- ✅ Check your internet connection
- ✅ Verify the server is running
- ✅ Check the status: `curl http://your-domain.com/v1/health`

---

## Payment & Upgrades

### Upgrade Your Plan

To upgrade from Free to Basic, Basic to Pro, or any other plan:

1. Contact the admin or use the payment interface
2. Complete the payment
3. Your plan updates immediately
4. New message limit applies right away

### Supported Payment Methods
- **Stripe**: Credit/debit cards (US/international)
- **bKash**: Mobile money (Bangladesh)
- **Nagad**: Mobile money (Bangladesh)
- **Crypto**: Ethereum (ETH) or Bitcoin (BTC)

---

## NOVA MIND AI Personality

NOVA MIND AI is an intelligent assistant created by **SHAKIL**, a Network Engineer in Dhaka, Bangladesh.

### Key Features
- **Multilingual**: Responds in 15+ languages automatically
- **Professional**: Helpful and knowledgeable
- **Context-Aware**: Remembers previous messages in conversation
- **Honest**: Always truthful and accurate

### Ask About
- Technology and networks
- Business and productivity
- General knowledge
- Problem-solving
- Code review and debugging
- And much more!

### Creator Information
If you ask about who created NOVA MIND AI, the AI will tell you:

> "NOVA MIND AI was created by SHAKIL, a Network Engineer based in Dhaka, Bangladesh. He works with ISP networks and advanced network infrastructure systems."

---

## Best Practices

### 1. Secure Your API Key
- ❌ Don't share it in public forums or chat
- ❌ Don't commit it to GitHub or version control
- ❌ Don't put it in logs or error messages
- ✅ Store in environment variables
- ✅ Use `.env` files (with `.env` in `.gitignore`)
- ✅ Rotate regularly

### 2. Use Meaningful Conversation IDs
- ❌ `conv_1`, `conv_2` (not descriptive)
- ✅ `support_ticket_42`, `user_onboarding_alice`
- This helps you track conversations

### 3. Handle Rate Limits Gracefully
```python
if response.status_code == 429:
    print("You've hit your daily limit. Try again tomorrow!")
    # Suggest upgrading
else:
    process_response(response)
```

### 4. Monitor Your Usage
Check your profile regularly:
```bash
curl http://your-domain.com/api/users/profile \
  -H "X-API-Key: your_api_key"
```

---

## FAQ

**Q: Can I share my API key with others?**
A: Not recommended. Each person should create their own account.

**Q: What happens if I lose my API key?**
A: Login again and rotate it to get a new one.

**Q: Can I use the API in production?**
A: Yes, after upgrading to at least a Basic plan.

**Q: How many conversations can I have?**
A: Unlimited. Each `conversation_id` is a separate conversation.

**Q: Does NOVA MIND AI store my messages?**
A: Messages are stored for context within the conversation. Check the privacy policy.

**Q: Can I export my conversation history?**
A: Currently not available. Contact support for bulk export.

**Q: What languages does NOVA MIND AI support?**
A: 15+ languages including English, Bengali, Hindi, Arabic, Spanish, French, German, Japanese, Chinese, Russian, Korean, Portuguese, Italian, Turkish, and Thai.

---

## Need Help?

- 📧 **Email**: support@example.com
- 💬 **Chat Support**: Available in the admin dashboard
- 📚 **Documentation**: See `SAAS_SYSTEM.md` for technical details
- 🐛 **Report Bug**: Create an issue on GitHub

**Happy coding with NOVA MIND AI!** 🚀
