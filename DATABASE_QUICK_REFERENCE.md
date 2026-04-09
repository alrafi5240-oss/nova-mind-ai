# Database Quick Reference

## 🚀 Quick Start (5 minutes)

### 1. Setup PostgreSQL
```bash
brew install postgresql@15
brew services start postgresql@15
psql -U postgres
CREATE USER nova_mind WITH PASSWORD 'password';
CREATE DATABASE nova_mind_ai OWNER nova_mind;
\q
```

### 2. Configure .env
```env
DATABASE_URL=postgresql+asyncpg://nova_mind:password@localhost:5432/nova_mind_ai
```

### 3. Run Migrations
```bash
alembic upgrade head
```

### 4. Use in Routes
```python
from src.database.dependencies import get_database

@router.get("/api/users/{user_id}")
async def get_user(user_id: str, db = Depends(get_database)):
    user = await db.users.get_by_id(user_id)
    return user
```

---

## 📁 File Structure

```
src/database/
├── __init__.py
├── config.py              # Database engine and session setup
├── models.py              # SQLAlchemy ORM models
├── repositories.py        # Data access layer (CRUD)
├── service.py             # Business logic layer
└── dependencies.py        # FastAPI dependency injection

alembic/
├── env.py                 # Migration environment
├── script.py.mako         # Migration template
└── versions/
    └── 001_initial_schema.py  # Initial database schema
```

---

## 🔑 Key Concepts

### Models (src/database/models.py)
```python
class User(Base):
    user_id: UUID          # Primary key
    email: str             # Unique
    api_key: str           # Unique
    plan: str              # "free", "basic", "pro", "elite"
    created_at: DateTime   # Auto-set by server
```

### Repositories (src/database/repositories.py)
```python
class UserRepository:
    async def get_by_id(user_id) -> User
    async def get_by_api_key(api_key) -> User
    async def create(...) -> User
    async def update_plan(...) -> User
```

### Service (src/database/service.py)
```python
class DatabaseService:
    users: UserRepository
    subscriptions: SubscriptionRepository
    conversations: ConversationRepository
    messages: MessageRepository
    usage: DailyUsageRepository

    async def get_user_plan_and_limit(user_id) -> (plan, limit)
    async def check_user_quota(user_id) -> (bool, reason)
    async def increment_usage(user_id, tokens_used) -> None
```

### Dependency Injection (src/database/dependencies.py)
```python
async def get_database(session: AsyncSession) -> DatabaseService:
    return DatabaseService(session)

# In routes:
async def my_route(db = Depends(get_database)):
    user = await db.users.get_by_id(user_id)
```

---

## 🗄️ Tables Overview

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| **users** | User accounts | user_id, email, api_key, plan |
| **subscriptions** | Subscription plans | subscription_id, user_id, plan, status |
| **payments** | Payment transactions | payment_id, user_id, amount, status |
| **conversations** | Chat sessions | conversation_id, user_id, title |
| **messages** | Chat messages | message_id, conversation_id, role, content |
| **daily_usage** | Usage tracking | usage_id, user_id, date, message_count |

---

## 💻 Common Operations

### Get User
```python
user = await db.users.get_by_id(user_id)
user = await db.users.get_by_api_key(api_key)
user = await db.users.get_by_email(email)
```

### Create User
```python
user = await db.users.create(
    email="test@example.com",
    username="testuser",
    password_hash="hash...",
    api_key="key...",
)
await db.commit()
```

### Get Conversations
```python
conversations = await db.conversations.get_by_user(user_id)
```

### Save Message
```python
message = await db.messages.create(
    user_id=user_id,
    conversation_id=conversation_id,
    role="user",
    content="Hello",
)
await db.increment_usage(user_id, tokens_used=10)
await db.commit()
```

### Check Quota
```python
can_chat, reason = await db.check_user_quota(user_id)
if not can_chat:
    raise HTTPException(status_code=429, detail=reason)
```

### Get Usage Statistics
```python
message_count, limit = await db.get_today_usage(user_id)
stats = await db.admin_get_usage_stats(user_id, days=30)
```

---

## 🔄 Migrations

### Generate Migration After Model Change
```bash
alembic revision --autogenerate -m "Add email_verified to users"
```

### Apply Migrations
```bash
alembic upgrade head          # Latest
alembic upgrade 001           # Specific migration
```

### Rollback
```bash
alembic downgrade -1          # One back
alembic downgrade 001         # To specific
```

### Check Status
```bash
alembic current               # Current migration
alembic history               # Migration history
```

---

## ⚙️ Configuration

### Connection Pool (src/database/config.py)
```python
pool_size=20           # Connections to keep ready
max_overflow=10        # Extra connections allowed
pool_pre_ping=True     # Test connection before use
pool_recycle=3600      # Recycle after 1 hour
```

### Environment Variables
```env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/nova_mind_ai
SQL_ECHO=false                          # Show SQL in logs?
```

---

## 🔍 Debugging

### Enable SQL Query Logging
```env
SQL_ECHO=true
```

### Check Database Connection
```bash
psql -U nova_mind -d nova_mind_ai -c "SELECT now();"
```

### Run Migrations (dry run)
```bash
alembic upgrade head --sql
```

### Check Table Schema
```sql
\dt                           -- List tables
\d+ users                    -- Show users table
```

---

## 📚 Documentation Files

| File | Content |
|------|---------|
| `DATABASE_SETUP.md` | Installation, PostgreSQL setup, migrations |
| `DATABASE_USAGE.md` | Examples, patterns, error handling |
| `POSTGRES_INTEGRATION_CHECKLIST.md` | Checklist, production config |
| `DATABASE_QUICK_REFERENCE.md` | This file |

---

## ✅ Production Checklist

- [ ] Database hosted (AWS RDS, Digital Ocean, etc.)
- [ ] SSL/TLS encryption enabled
- [ ] Strong password (30+ chars)
- [ ] Automated daily backups
- [ ] Connection pooling tuned
- [ ] Monitoring and alerting
- [ ] Slow query logging
- [ ] Credentials in secret manager
- [ ] Firewall rules configured

---

## 🆘 Common Issues

| Issue | Solution |
|-------|----------|
| "relation does not exist" | Run `alembic upgrade head` |
| "connection refused" | Start PostgreSQL, check DATABASE_URL |
| "Column does not exist" | Model changed - run migrations |
| "Unique constraint violation" | Check for duplicate email/api_key |
| "Foreign key violation" | Verify referenced user/conversation exists |

---

## 🎯 Next Steps

1. Follow "Quick Start" section above
2. Use `get_database` dependency in routes
3. See `DATABASE_USAGE.md` for complete examples
4. Set up backups and monitoring
5. Configure production database

---

**Version:** 1.0
**Last Updated:** April 2024
**Status:** Production-Ready
