# Database Service & Repository Usage Guide

## Overview

The database layer provides a clean, async-first interface for all data operations:

- **Repositories** - Low-level data access (CRUD operations)
- **Services** - High-level business logic
- **Dependencies** - FastAPI integration for injection

```
FastAPI Route
    ↓
get_database (dependency injection)
    ↓
DatabaseService
    ↓
Repositories (UserRepository, ConversationRepository, etc.)
    ↓
SQLAlchemy ORM Models
    ↓
PostgreSQL
```

---

## Getting Started

### 1. Import DatabaseService in Your Route

```python
from fastapi import APIRouter, Depends, HTTPException
from src.database.dependencies import get_database
from src.database.service import DatabaseService

router = APIRouter()

@router.get("/api/me")
async def get_current_user(
    api_key: str,
    db: DatabaseService = Depends(get_database),
):
    """Get current user by API key."""
    user = await db.users.get_by_api_key(api_key)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return {"user_id": user.user_id, "email": user.email, "plan": user.plan}
```

### 2. Key Methods

All database operations are **async** and must use `await`:

```python
# ✅ Correct
user = await db.users.get_by_id(user_id)

# ❌ Wrong
user = db.users.get_by_id(user_id)  # Missing await!
```

---

## Common Patterns

### Pattern 1: Get or Raise 404

```python
async def get_user_or_404(user_id: str, db: DatabaseService):
    user = await db.users.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# In route:
@router.get("/api/users/{user_id}")
async def get_user(
    user_id: str,
    db: DatabaseService = Depends(get_database),
):
    user = await get_user_or_404(user_id, db)
    return user
```

### Pattern 2: Check Ownership

```python
async def check_user_owns_conversation(
    user_id: str,
    conversation_id: str,
    db: DatabaseService,
) -> bool:
    conversation = await db.conversations.get_by_id(conversation_id)
    if not conversation:
        return False
    return conversation.user_id == user_id

# In route:
@router.get("/api/conversations/{conversation_id}/messages")
async def get_messages(
    user_id: str,
    conversation_id: str,
    db: DatabaseService = Depends(get_database),
):
    if not await check_user_owns_conversation(user_id, conversation_id, db):
        raise HTTPException(status_code=403, detail="Not authorized")

    messages = await db.messages.get_by_conversation(conversation_id)
    return messages
```

### Pattern 3: Create with Defaults

```python
@router.post("/api/users")
async def create_user(
    email: str,
    username: str,
    password: str,
    db: DatabaseService = Depends(get_database),
):
    """Create a new user."""
    # Check if user already exists
    existing = await db.users.get_by_email(email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    # Hash password (use bcrypt or similar in production!)
    password_hash = hash_password(password)

    # Generate unique API key
    api_key = generate_api_key()

    # Create user
    user = await db.users.create(
        email=email,
        username=username,
        password_hash=password_hash,
        api_key=api_key,
    )

    # Commit to database
    await db.commit()

    return {
        "user_id": user.user_id,
        "email": user.email,
        "api_key": api_key,  # Only return once during creation!
    }
```

### Pattern 4: Update and Commit

```python
@router.put("/api/users/{user_id}/plan")
async def update_user_plan(
    user_id: str,
    plan: str,
    db: DatabaseService = Depends(get_database),
):
    """Update user's subscription plan."""
    user = await db.users.update_plan(user_id, plan)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Commit changes to database
    await db.commit()

    return {"user_id": user.user_id, "plan": user.plan}
```

### Pattern 5: List with Pagination

```python
@router.get("/api/users")
async def list_users(
    skip: int = 0,
    limit: int = 50,
    db: DatabaseService = Depends(get_database),
):
    """List all users (admin endpoint)."""
    users = await db.users.list_all(skip=skip, limit=limit)
    total = await db.users.count()

    return {
        "users": [
            {
                "user_id": user.user_id,
                "email": user.email,
                "plan": user.plan,
            }
            for user in users
        ],
        "total": total,
        "skip": skip,
        "limit": limit,
    }
```

---

## Complete Examples

### Example 1: Save Chat Message

```python
from datetime import datetime
from src.database.dependencies import get_database
from src.database.service import DatabaseService

@router.post("/api/conversations/{conversation_id}/messages")
async def save_message(
    user_id: str,
    conversation_id: str,
    role: str,  # "user" or "assistant"
    content: str,
    tokens_used: int = 0,
    db: DatabaseService = Depends(get_database),
):
    """Save a message to a conversation."""

    # 1. Verify user owns conversation
    conversation = await db.conversations.get_by_id(conversation_id)
    if not conversation or conversation.user_id != user_id:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # 2. Save message
    message = await db.messages.create(
        user_id=user_id,
        conversation_id=conversation_id,
        role=role,
        content=content,
        tokens_used=tokens_used,
    )

    # 3. Update daily usage
    today = datetime.utcnow().date().isoformat()
    await db.usage.increment_messages(user_id, today, 1)
    if tokens_used > 0:
        await db.usage.increment_tokens(user_id, today, tokens_used)

    # 4. Commit all changes
    await db.commit()

    return {
        "message_id": message.message_id,
        "role": message.role,
        "content": message.content,
        "created_at": message.created_at,
    }
```

### Example 2: Get Conversation with Messages

```python
@router.get("/api/conversations/{conversation_id}")
async def get_conversation(
    user_id: str,
    conversation_id: str,
    db: DatabaseService = Depends(get_database),
):
    """Get conversation with all messages."""

    # 1. Get conversation
    conversation = await db.conversations.get_by_id(conversation_id)
    if not conversation or conversation.user_id != user_id:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # 2. Get all messages
    messages = await db.messages.get_by_conversation(conversation_id)

    # 3. Get message count and token count
    message_count = await db.messages.count_by_conversation(conversation_id)
    token_count = await db.messages.count_tokens_by_conversation(conversation_id)

    return {
        "conversation_id": conversation.conversation_id,
        "title": conversation.title,
        "created_at": conversation.created_at,
        "message_count": message_count,
        "token_count": token_count,
        "messages": [
            {
                "message_id": msg.message_id,
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at,
            }
            for msg in messages
        ],
    }
```

### Example 3: Check Quota and Send Message

```python
@router.post("/api/chat")
async def chat(
    user_id: str,
    message: str,
    conversation_id: str = "default",
    db: DatabaseService = Depends(get_database),
):
    """Send a message - checks quota first."""

    # 1. Check if user can chat
    can_chat, reason = await db.check_user_quota(user_id)
    if not can_chat:
        raise HTTPException(status_code=429, detail=reason)

    # 2. Get conversation or create
    conversation = await db.conversations.get_by_id(conversation_id)
    if not conversation:
        conversation = await db.conversations.create(
            user_id=user_id,
            conversation_id=conversation_id,
        )

    # 3. Save user message
    user_msg = await db.messages.create(
        user_id=user_id,
        conversation_id=conversation_id,
        role="user",
        content=message,
    )

    # 4. Get OpenAI response (your existing logic)
    from src.services.openai_service import openai_service
    response = await openai_service.get_response(message)

    # 5. Save AI response
    ai_msg = await db.messages.create(
        user_id=user_id,
        conversation_id=conversation_id,
        role="assistant",
        content=response,
    )

    # 6. Update usage
    await db.increment_usage(user_id, tokens_used=0)

    # 7. Commit everything
    await db.commit()

    return {
        "conversation_id": conversation_id,
        "response": response,
        "message_id": ai_msg.message_id,
    }
```

### Example 4: Admin - Get User Statistics

```python
@router.get("/admin/users/{user_id}/stats")
async def get_user_stats(
    user_id: str,
    days: int = 30,
    db: DatabaseService = Depends(get_database),
):
    """Get user statistics (admin endpoint)."""

    # Verify user is admin (implement your auth check)
    # if not request.user.is_admin:
    #     raise HTTPException(status_code=403)

    # Get user
    user = await db.users.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get subscription
    subscription = await db.subscriptions.get_active_by_user(user_id)

    # Get usage stats
    usage_stats = await db.admin_get_usage_stats(user_id, days)

    # Get recent payments
    payments = await db.payments.get_by_user(user_id, limit=10)

    return {
        "user": {
            "user_id": user.user_id,
            "email": user.email,
            "plan": user.plan,
            "is_active": user.is_active,
            "created_at": user.created_at,
        },
        "subscription": {
            "plan": subscription.plan if subscription else None,
            "status": subscription.status if subscription else None,
            "end_date": subscription.end_date if subscription else None,
        },
        "usage": usage_stats,
        "recent_payments": [
            {
                "payment_id": p.payment_id,
                "amount": p.amount_usd,
                "status": p.status,
                "created_at": p.created_at,
            }
            for p in payments
        ],
    }
```

---

## Error Handling

### Common Errors and Fixes

**Error: "Object is not attached to a session"**

Problem: Trying to access relationship after session closed
```python
# ❌ Wrong
user = await db.users.get_by_id(user_id)
await db.session.close()
print(user.subscriptions)  # Error! Session closed

# ✅ Correct
user = await db.users.get_by_id(user_id)
print(user.subscriptions)  # Use before session closes
await db.commit()
```

**Error: "Foreign key violation"**

Problem: Creating record with invalid foreign key
```python
# ❌ Wrong
message = await db.messages.create(
    user_id="invalid_user_id",  # User doesn't exist
    conversation_id="conv1",
    role="user",
    content="test",
)

# ✅ Correct
# Verify user exists first
user = await db.users.get_by_id(user_id)
if not user:
    raise HTTPException(status_code=404, detail="User not found")

message = await db.messages.create(...)
```

**Error: "Unique constraint violation"**

Problem: Creating duplicate unique value
```python
# ❌ Wrong
await db.users.create(
    email="duplicate@example.com",  # Already exists
    username="newuser",
    password_hash="hash",
    api_key="newkey",
)

# ✅ Correct
existing = await db.users.get_by_email("duplicate@example.com")
if existing:
    raise HTTPException(status_code=409, detail="Email already registered")

await db.users.create(...)
```

---

## Performance Tips

### 1. Use Pagination for Large Lists

```python
# ❌ Inefficient - loads all records
users = await db.users.list_all()  # Could be thousands!

# ✅ Efficient - load in batches
users = await db.users.list_all(skip=0, limit=50)
```

### 2. Only Commit When Needed

```python
# ❌ Multiple commits (slow)
message1 = await db.messages.create(...)
await db.commit()
message2 = await db.messages.create(...)
await db.commit()

# ✅ Single commit (fast)
message1 = await db.messages.create(...)
message2 = await db.messages.create(...)
await db.commit()
```

### 3. Use Specific Queries

```python
# ❌ Loads full conversation
conversation = await db.conversations.get_by_id(conv_id)
if conversation.user_id == user_id:  # Extra check

# ✅ Filters at database level
is_owner = conversation.user_id == user_id  # Already have it
```

---

## Testing Database Operations

### Unit Test Example

```python
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from src.database.models import Base
from src.database.repositories import UserRepository


@pytest.fixture
async def test_db():
    """Create in-memory SQLite database for testing."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Create session
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with AsyncSessionLocal() as session:
        yield session

    # Cleanup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.mark.asyncio
async def test_create_user(test_db):
    """Test user creation."""
    repo = UserRepository(test_db)

    user = await repo.create(
        email="test@example.com",
        username="testuser",
        password_hash="hash",
        api_key="key123",
    )

    assert user.email == "test@example.com"
    assert user.username == "testuser"

    # Verify can retrieve
    retrieved = await repo.get_by_email("test@example.com")
    assert retrieved.user_id == user.user_id
```

---

## Migration and Data Integrity

### Before Running Migrations

```bash
# Always backup first
pg_dump -U nova_mind -d nova_mind_ai > backup_$(date +%Y%m%d).sql

# Review migration
cat alembic/versions/002_*.py

# Run migration (dry run first)
alembic upgrade head --sql

# Actually run migration
alembic upgrade head
```

### Rollback if Needed

```bash
# Go back one migration
alembic downgrade -1

# Go back to specific migration
alembic downgrade 001

# Check status
alembic current
```

---

## Next Steps

1. **Add to your routes** - Import `get_database` and use in endpoints
2. **Update existing services** - Replace in-memory storage with database
3. **Test thoroughly** - Unit and integration tests with test database
4. **Monitor** - Watch database growth and slow queries
5. **Backup** - Set up automated backups

---

**Last Updated:** April 2024
