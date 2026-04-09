# PostgreSQL Database Setup Guide

## Overview

NOVA MIND AI uses **PostgreSQL** with **SQLAlchemy ORM** for async database operations. The system includes:

- **6 main tables**: Users, Subscriptions, Payments, Conversations, Messages, DailyUsage
- **Async support** with `asyncpg` driver for non-blocking database access
- **Migrations** managed with Alembic for schema versioning
- **Connection pooling** for production-ready performance
- **Timezone-aware** timestamp handling with server-side defaults
- **JSONB columns** for flexible metadata storage

---

## Prerequisites

### 1. Install PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

### 2. Verify Installation

```bash
psql --version
psql -U postgres -c "SELECT version();"
```

---

## Database Setup

### Step 1: Create Database and User

```bash
# Connect to PostgreSQL as admin
psql -U postgres

# Inside psql shell:
CREATE USER nova_mind WITH PASSWORD 'your_secure_password';
CREATE DATABASE nova_mind_ai OWNER nova_mind;
GRANT ALL PRIVILEGES ON DATABASE nova_mind_ai TO nova_mind;
\q
```

### Step 2: Verify Connection

```bash
psql -U nova_mind -d nova_mind_ai -h localhost -c "SELECT now();"
```

### Step 3: Configure Environment

Create or update `.env` file in backend root:

```env
# Database Configuration
DATABASE_URL=postgresql+asyncpg://nova_mind:your_secure_password@localhost:5432/nova_mind_ai

# Optional: Show SQL queries in logs (useful for debugging)
SQL_ECHO=false
```

---

## Database Migrations

### Understanding Migrations

Migrations are version-controlled database schema changes. They:
- Create/modify/drop tables
- Add/remove columns and indexes
- Define foreign keys and constraints
- Run in sequence (001, 002, 003, etc.)

### Initial Migration

The initial migration (`alembic/versions/001_initial_schema.py`) creates all tables:

```
users
├── user_id (UUID, PK)
├── email, username, api_key (unique)
├── plan, is_active, is_verified
└── timestamps

subscriptions
├── subscription_id (UUID, PK)
├── user_id (FK)
├── plan, status, monthly_message_limit
└── dates and auto_renew flag

payments
├── payment_id (UUID, PK)
├── user_id (FK), subscription_id (FK)
├── amount, currency, method, status
└── transaction tracking

conversations
├── conversation_id (String, PK)
├── user_id (FK)
├── title, description, is_active, is_archived
└── timestamps

messages
├── message_id (UUID, PK)
├── user_id, conversation_id (FKs)
├── role, content, tokens_used
└── timestamps

daily_usage
├── usage_id (UUID, PK)
├── user_id (FK), date (unique composite)
├── message_count, tokens_used
└── timestamps
```

### Running Migrations

**Initialize Alembic** (first time only):
```bash
# From backend root
alembic init -t async alembic
```

**Apply migrations:**
```bash
# Upgrade to latest migration
alembic upgrade head

# Upgrade to specific migration
alembic upgrade 001

# Show current migration
alembic current

# Show migration history
alembic history
```

**Downgrade migrations:**
```bash
# Downgrade one migration
alembic downgrade -1

# Downgrade to specific migration
alembic downgrade 001
```

---

## Creating New Migrations

### When to Create a Migration

Create a new migration when you need to:
- Add a new table
- Add/remove columns
- Add/remove indexes
- Change column types or constraints
- Update relationships

### Creating a Migration

**Option 1: Auto-generate from model changes** (recommended)

1. Modify model in `src/database/models.py`
2. Generate migration:
```bash
alembic revision --autogenerate -m "Add user_email_verified column"
```
3. Review generated migration in `alembic/versions/`
4. Apply migration:
```bash
alembic upgrade head
```

**Option 2: Manual migration**

```bash
alembic revision -m "Add user_email_verified column"
```

Then edit the generated file in `alembic/versions/` and implement `upgrade()` and `downgrade()`.

### Migration File Structure

```python
"""Description of what this migration does

Revision ID: 002
Revises: 001
Create Date: 2024-04-06 12:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = '002'
down_revision = '001'


def upgrade() -> None:
    """Apply migration (forward)."""
    # Add column to users table
    op.add_column('users', sa.Column('email_verified', sa.Boolean(), nullable=False, server_default='false'))

    # Add index
    op.create_index('ix_user_email_verified', 'users', ['email_verified'])


def downgrade() -> None:
    """Revert migration (backward)."""
    # Drop index
    op.drop_index('ix_user_email_verified', 'users')

    # Remove column
    op.drop_column('users', 'email_verified')
```

---

## Repository Layer

The repository pattern provides a clean data access layer with async operations.

### Available Repositories

```python
from src.database.dependencies import get_database

# In FastAPI route:
async def example(db: DatabaseService = Depends(get_database)):
    # Users
    user = await db.users.get_by_api_key(api_key)
    user = await db.users.get_by_email(email)
    user = await db.users.get_by_id(user_id)

    # Subscriptions
    sub = await db.subscriptions.get_active_by_user(user_id)

    # Conversations
    convs = await db.conversations.get_by_user(user_id)

    # Messages
    messages = await db.messages.get_by_conversation(conversation_id)

    # Usage
    usage = await db.usage.get_by_user_date(user_id, date)

    # Commit changes
    await db.commit()
```

### Repository Methods

**UserRepository:**
- `get_by_id(user_id)` - Get user by ID
- `get_by_email(email)` - Get user by email
- `get_by_api_key(api_key)` - Get user by API key
- `get_by_username(username)` - Get user by username
- `list_all(skip, limit)` - List all users with pagination
- `create(email, username, password_hash, api_key)` - Create new user
- `update_plan(user_id, plan)` - Update user's plan
- `update(user_id, **kwargs)` - Update arbitrary fields
- `delete(user_id)` - Soft delete user
- `count()` - Count total users

**SubscriptionRepository:**
- `get_by_id(subscription_id)` - Get subscription
- `get_active_by_user(user_id)` - Get active subscription
- `get_by_user(user_id, skip, limit)` - Get all subscriptions
- `create(user_id, plan, ...)` - Create subscription
- `update_status(subscription_id, status)` - Update status
- `extend(subscription_id, days)` - Extend end date
- `deactivate(subscription_id)` - Deactivate

**ConversationRepository:**
- `get_by_id(conversation_id)` - Get conversation
- `get_by_user(user_id, archived=False)` - Get user's conversations
- `create(user_id, conversation_id, title)` - Create conversation
- `update_title(conversation_id, title)` - Update title
- `archive(conversation_id)` - Archive conversation
- `delete(conversation_id)` - Soft delete

**MessageRepository:**
- `get_by_id(message_id)` - Get message
- `get_by_conversation(conversation_id)` - Get all messages
- `get_by_user_conversation(user_id, conversation_id)` - Get user's messages
- `create(user_id, conversation_id, role, content)` - Create message
- `count_by_conversation(conversation_id)` - Count messages
- `count_tokens_by_conversation(conversation_id)` - Count tokens
- `delete(message_id)` - Delete message

**DailyUsageRepository:**
- `get_by_user_date(user_id, date)` - Get usage for specific date
- `get_or_create(user_id, date)` - Get or create usage record
- `increment_messages(user_id, date, count)` - Add messages
- `increment_tokens(user_id, date, tokens)` - Add tokens
- `get_by_user(user_id, skip, limit)` - Get user's usage records
- `get_last_days(user_id, days)` - Get last N days
- `get_total_tokens(user_id, days)` - Get total tokens
- `get_total_messages(user_id, days)` - Get total messages

---

## Using in FastAPI Routes

### Example: Create User and Save Message

```python
from fastapi import APIRouter, Depends
from src.database.dependencies import get_database
from src.database.service import DatabaseService

router = APIRouter()

@router.post("/api/conversations/{conversation_id}/messages")
async def create_message(
    user_id: str,
    conversation_id: str,
    content: str,
    db: DatabaseService = Depends(get_database),
):
    """Save a message to a conversation."""
    # Check user exists
    user = await db.users.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check conversation exists and belongs to user
    conversation = await db.conversations.get_by_id(conversation_id)
    if not conversation or conversation.user_id != user_id:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Save message
    message = await db.messages.create(
        user_id=user_id,
        conversation_id=conversation_id,
        role="user",
        content=content,
        tokens_used=0,
    )

    # Update usage
    await db.usage.increment_messages(user_id, datetime.utcnow().date().isoformat())

    # Commit all changes
    await db.commit()

    return {"message_id": message.message_id, "content": message.content}
```

---

## Connection Pooling Configuration

PostgreSQL connection pool is configured in `src/database/config.py`:

```python
pool_size=20              # Keep 20 connections ready
max_overflow=10           # Allow up to 10 extra connections
pool_pre_ping=True        # Test connection before using
pool_recycle=3600         # Recycle connection every 1 hour
```

### Tuning Pool Size

**Development:**
```python
pool_size=5
max_overflow=5
```

**Production (high traffic):**
```python
pool_size=50
max_overflow=20
```

---

## Production Deployment

### 1. PostgreSQL Setup

```bash
# On production server
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE USER nova_mind_prod WITH ENCRYPTED PASSWORD 'strong_password_here';
CREATE DATABASE nova_mind_ai_prod OWNER nova_mind_prod;
GRANT ALL PRIVILEGES ON DATABASE nova_mind_ai_prod TO nova_mind_prod;
```

### 2. Backup and Restore

**Backup database:**
```bash
pg_dump -U nova_mind -d nova_mind_ai > backup.sql
```

**Restore database:**
```bash
psql -U nova_mind -d nova_mind_ai < backup.sql
```

### 3. Environment Configuration

```env
# Production
DATABASE_URL=postgresql+asyncpg://nova_mind_prod:strong_password@prod-db.example.com:5432/nova_mind_ai_prod
SQL_ECHO=false
LOG_LEVEL=INFO
```

### 4. Connection String Security

**DO NOT** commit `.env` with real credentials to git!

Use secure secret management:
- AWS Secrets Manager
- HashiCorp Vault
- GitHub Secrets
- Docker secrets
- Environment variables at deployment time

---

## Troubleshooting

### Connection Failed

```
sqlalchemy.exc.OperationalError: (asyncpg.exceptions.CannotConnectNowError)
```

**Solution:**
1. Verify PostgreSQL is running: `sudo systemctl status postgresql`
2. Check credentials in `.env`: `DATABASE_URL`
3. Test connection: `psql -U nova_mind -d nova_mind_ai`
4. Check firewall: `sudo ufw allow 5432`

### "relation does not exist"

Tables don't exist - you need to run migrations:
```bash
alembic upgrade head
```

### "Column does not exist"

Model changed but migration not run:
```bash
alembic revision --autogenerate -m "Your description"
alembic upgrade head
```

### Performance Issues

Check slow queries:
```sql
-- In PostgreSQL
SELECT query, calls, mean_time FROM pg_stat_statements
ORDER BY mean_time DESC LIMIT 10;
```

Optimize with indexes:
```sql
CREATE INDEX idx_messages_user_conversation ON messages(user_id, conversation_id);
```

---

## Next Steps

1. ✅ **Setup PostgreSQL** - Done with this guide
2. ✅ **Run migrations** - `alembic upgrade head`
3. ✅ **Start backend** - `python -m uvicorn src.main:app --reload`
4. 📝 **Create users** - Via API `/api/users/register`
5. 📝 **Test chat** - Conversations and messages save to database
6. 📝 **Monitor** - Check logs and database growth

---

## Database Diagram

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ user_id (PK)    │
│ email           │
│ username        │
│ password_hash   │
│ api_key         │
│ plan            │
│ created_at      │
└────────┬────────┘
         │
      ┌──┴──────────────────┬─────────────┬──────────────┐
      │                     │             │              │
      │                     │             │              │
┌─────▼──────────┐  ┌──────▼────┐  ┌────▼─────┐  ┌─────▼──────────┐
│subscriptions   │  │ payments   │  │messages   │  │ daily_usage    │
├────────────────┤  ├────────────┤  ├───────────┤  ├────────────────┤
│sub_id (PK)     │  │payment_id  │  │msg_id     │  │usage_id (PK)   │
│user_id (FK)    │  │user_id (FK)│  │user_id(FK)│  │user_id (FK)    │
│plan            │  │amount      │  │conv_id(FK)│  │date            │
│status          │  │method      │  │role       │  │message_count   │
│end_date        │  │status      │  │content    │  │tokens_used     │
└────────────────┘  └─────┬──────┘  └───────────┘  └────────────────┘
                          │
                    ┌─────▼────────────┐
                    │ conversations    │
                    ├──────────────────┤
                    │conv_id (PK)      │
                    │user_id (FK)      │
                    │title             │
                    │created_at        │
                    └──────────────────┘
```

---

## Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [SQLAlchemy Async Docs](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)
- [Alembic Docs](https://alembic.sqlalchemy.org/)
- [asyncpg Driver](https://magicstack.github.io/asyncpg/)

---

**Last Updated:** April 2024
**Status:** Production-Ready
