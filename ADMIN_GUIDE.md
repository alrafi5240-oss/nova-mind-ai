# NOVA MIND AI - Admin Guide

## Admin Access

### Getting Started

Set the admin token in `.env`:

```env
ADMIN_TOKEN=your_secret_admin_token_here
```

Use it in all admin requests:

```bash
curl -X GET http://your-domain.com/admin/users \
  -H "X-Admin-Token: your_secret_admin_token_here"
```

---

## User Management

### List All Users

```bash
curl -X GET "http://your-domain.com/admin/users?page=1&per_page=20" \
  -H "X-Admin-Token: {admin_token}"
```

Response:
```json
{
  "users": [
    {
      "user_id": "abc123",
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

### Get User Details

```bash
curl -X GET "http://your-domain.com/admin/users/{user_id}" \
  -H "X-Admin-Token: {admin_token}"
```

Response:
```json
{
  "user": {
    "user_id": "abc123",
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

### Change User Plan

```bash
curl -X PUT "http://your-domain.com/admin/users/{user_id}/plan" \
  -H "X-Admin-Token: {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "pro",
    "reason": "Special promotional offer"
  }'
```

### Activate User

Reactivate a suspended account:

```bash
curl -X POST "http://your-domain.com/admin/users/{user_id}/activate" \
  -H "X-Admin-Token: {admin_token}"
```

### Suspend User

Disable a user account:

```bash
curl -X POST "http://your-domain.com/admin/users/{user_id}/suspend" \
  -H "X-Admin-Token: {admin_token}"
```

Suspended users cannot use the API.

### Delete User

Soft-delete a user (marks as inactive):

```bash
curl -X DELETE "http://your-domain.com/admin/users/{user_id}" \
  -H "X-Admin-Token: {admin_token}"
```

Data is preserved, account is just marked as deleted.

---

## Usage Tracking

### View System Usage

Get overall usage for the system:

```bash
curl -X GET "http://your-domain.com/admin/usage" \
  -H "X-Admin-Token: {admin_token}"
```

### View Specific User Usage

Check usage for a specific user over the last N days:

```bash
curl -X GET "http://your-domain.com/admin/usage/{user_id}?days=7" \
  -H "X-Admin-Token: {admin_token}"
```

Response:
```json
{
  "user_id": "abc123",
  "days": 7,
  "usage": [
    {
      "user_id": "abc123",
      "date": "2026-04-06",
      "message_count": 8,
      "tokens_used": 2500
    },
    {
      "user_id": "abc123",
      "date": "2026-04-05",
      "message_count": 10,
      "tokens_used": 3200
    }
  ]
}
```

### Usage Patterns to Monitor

| Pattern | Meaning | Action |
|---------|---------|--------|
| 0 messages/day | User not active | Consider disabling |
| Daily max limit | Heavy user | Monitor for abuse |
| Sudden increase | Bot activity? | Investigate |
| Consistent usage | Engaged user | Good sign |

---

## Payment & Billing

### List Payments

View all payment transactions:

```bash
curl -X GET "http://your-domain.com/admin/payments?page=1&per_page=20" \
  -H "X-Admin-Token: {admin_token}"
```

Optional filters:
- `?status=completed` - Completed payments only
- `?status=pending` - Pending payments
- `?status=failed` - Failed payments

Response:
```json
{
  "payments": [
    {
      "payment_id": "pay123",
      "user_id": "abc123",
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

### Monitor Revenue

Track total revenue from payments:

```bash
# Last 7 days of completed payments
curl -X GET "http://your-domain.com/admin/payments?status=completed" \
  -H "X-Admin-Token: {admin_token}" | jq '.total_revenue'
```

### Payment Methods

Track which payment methods are used:

| Method | Region | Status |
|--------|--------|--------|
| Stripe | US/Intl | Ready |
| bKash | Bangladesh | Structure |
| Nagad | Bangladesh | Structure |
| Crypto | Global | Structure |

---

## System Statistics

### View Dashboard Statistics

```bash
curl -X GET "http://your-domain.com/admin/stats" \
  -H "X-Admin-Token: {admin_token}"
```

Response:
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

### Key Metrics

| Metric | Meaning |
|--------|---------|
| total_users | All registered users (active + inactive) |
| premium_users | Users on paid plans (Basic, Pro, Elite) |
| free_users | Users on Free plan |
| active_users | Users who logged in recently |
| total_messages_today | API calls in the last 24 hours |
| total_revenue_usd | Revenue from completed payments |
| active_subscriptions | Subscriptions currently active |

### Monitoring Goals

**Healthy System:**
- Active users > 70% of total users
- Premium users > 20% of total
- Daily messages growing month-over-month
- < 5% payment failures

---

## Common Admin Tasks

### Create User Manually

Send a registration request on behalf of user:

```bash
curl -X POST "http://your-domain.com/api/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "username": "newuser",
    "password": "generated_password_123"
  }'
```

Share credentials with user securely.

### Grant Trial Period

Give a user a trial by upgrading them:

```bash
curl -X PUT "http://your-domain.com/admin/users/{user_id}/plan" \
  -H "X-Admin-Token: {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "pro",
    "reason": "30-day trial - will expire 2026-05-06"
  }'
```

### Investigate High Usage

Check if a user is being abused:

```bash
# Get user details
curl "http://your-domain.com/admin/users/{user_id}" \
  -H "X-Admin-Token: {admin_token}"

# Check recent usage
curl "http://your-domain.com/admin/usage/{user_id}?days=7" \
  -H "X-Admin-Token: {admin_token}"

# Check their IP from logs
# tail -f logs/app.log | grep {user_id}
```

If abuse detected:
```bash
# Suspend the account
curl -X POST "http://your-domain.com/admin/users/{user_id}/suspend" \
  -H "X-Admin-Token: {admin_token}"

# Contact user for verification
```

### Respond to Support Tickets

When a user reports an issue:

1. Get their details:
```bash
curl "http://your-domain.com/admin/users/{user_id}" \
  -H "X-Admin-Token: {admin_token}"
```

2. Check their usage:
```bash
curl "http://your-domain.com/admin/usage/{user_id}?days=30" \
  -H "X-Admin-Token: {admin_token}"
```

3. Take action (upgrade, reset limit, etc.):
```bash
curl -X PUT "http://your-domain.com/admin/users/{user_id}/plan" \
  -H "X-Admin-Token: {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "basic",
    "reason": "Support ticket #123 - Manual upgrade"
  }'
```

---

## Security Practices

### Protect Admin Token

**DO:**
- ✅ Store in `.env` file (gitignored)
- ✅ Use different tokens for different environments (dev, prod)
- ✅ Rotate token periodically
- ✅ Log admin access for audit trail

**DON'T:**
- ❌ Share token in email or Slack
- ❌ Commit to version control
- ❌ Expose in error messages
- ❌ Use same token across environments

### Admin Access Logs

Check who accessed admin panel:

```bash
# Search logs for admin access
grep "X-Admin-Token" logs/app.log

# Track admin actions
grep "Admin" logs/app.log
```

### Regular Security Checks

Weekly:
- [ ] Review new users for suspicious accounts
- [ ] Check for payment failures
- [ ] Monitor usage spikes

Monthly:
- [ ] Review payment provider logs
- [ ] Audit admin access logs
- [ ] Update security practices

---

## Troubleshooting

### "Invalid admin token"
- ✅ Check token is set in `.env`
- ✅ Verify `ADMIN_TOKEN` environment variable is correct
- ✅ Make sure header is `X-Admin-Token`, not `Authorization`
- ✅ Restart server after .env change

### "User not found"
- ✅ Verify user_id is correct
- ✅ Check user wasn't deleted
- ✅ Confirm user exists in system

### Payments stuck in "pending"
- ✅ Check payment provider status
- ✅ Verify webhook is receiving updates
- ✅ Check payment logs for errors

### High latency on admin endpoints
- ✅ Check system load: `curl /admin/stats`
- ✅ Monitor database/storage performance
- ✅ Consider caching frequently accessed data

---

## Scaling Checklist

As your user base grows:

**100 Users**
- ✅ Current system handles fine
- Monitor daily backups

**1,000 Users**
- Consider weekly backups
- Monitor file storage size
- Plan for database migration

**10,000+ Users**
- Migrate to PostgreSQL database
- Add Redis cache layer
- Implement database indexing
- Set up horizontal scaling

---

## Integration with NOVA MIND AI

### Custom System Prompt

The admin can't modify system prompt per request, but can:

1. Change user plan (affects quota)
2. Suspend user (blocks access)
3. View usage (monitor behavior)

NOVA MIND AI identity (created by SHAKIL) is always maintained.

### Conversation Privacy

- Users can only see their own conversations
- Admin cannot view user conversations (by design)
- Data is encrypted at rest when using database

### Rate Limiting

- Global: 60 req/60s per IP
- User quotas: Per plan limits
- Admin operations: No limit (trusted)

---

## API Reference

### Admin Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/admin/users` | List all users |
| GET | `/admin/users/{id}` | Get user details |
| PUT | `/admin/users/{id}/plan` | Change plan |
| POST | `/admin/users/{id}/activate` | Activate user |
| POST | `/admin/users/{id}/suspend` | Suspend user |
| DELETE | `/admin/users/{id}` | Delete user |
| GET | `/admin/usage` | System usage |
| GET | `/admin/usage/{id}` | User usage |
| GET | `/admin/payments` | List payments |
| GET | `/admin/stats` | System statistics |

---

## Support

For admin support:
- 📧 Email: admin-support@example.com
- 📚 See `SAAS_SYSTEM.md` for full technical details
- 🐛 Report bugs to the development team

**You're responsible for managing the SaaS platform!** 🚀
