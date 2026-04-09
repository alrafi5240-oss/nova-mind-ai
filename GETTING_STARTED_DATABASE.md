# Getting Started with Database - 10 Minute Setup

## 1. Install PostgreSQL (2 minutes)

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu:**
```bash
sudo apt update && sudo apt install postgresql postgresql-contrib
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

## 2. Create Database (2 minutes)

```bash
psql -U postgres

# Inside psql:
CREATE USER nova_mind WITH PASSWORD 'your_password';
CREATE DATABASE nova_mind_ai OWNER nova_mind;
\q
```

## 3. Configure Environment (1 minute)

Update `.env` file:
```env
DATABASE_URL=postgresql+asyncpg://nova_mind:your_password@localhost:5432/nova_mind_ai
```

## 4. Run Migrations (1 minute)

```bash
alembic upgrade head
```

## 5. Start Application (1 minute)

```bash
python -m uvicorn src.main:app --reload
```

Database is now ready! Tables created automatically on startup.

## 6. Use in Your Routes (2 minutes)

```python
from fastapi import APIRouter, Depends
from src.database.dependencies import get_database

router = APIRouter()

@router.get("/api/users/{user_id}")
async def get_user(
    user_id: str,
    db = Depends(get_database),
):
    user = await db.users.get_by_id(user_id)
    if not user:
        return {"error": "Not found"}
    return user

@router.post("/api/messages")
async def save_message(
    user_id: str,
    conversation_id: str,
    content: str,
    db = Depends(get_database),
):
    message = await db.messages.create(
        user_id=user_id,
        conversation_id=conversation_id,
        role="user",
        content=content,
    )
    await db.increment_usage(user_id)
    await db.commit()
    return message
```

Done! ✅

---

## Need More Help?

- **Setup issues?** → `DATABASE_SETUP.md`
- **How to use?** → `DATABASE_USAGE.md`
- **Quick reference?** → `DATABASE_QUICK_REFERENCE.md`
- **Full details?** → `POSTGRES_INTEGRATION_CHECKLIST.md`

## Verify It Works

```bash
# Test connection
psql -U nova_mind -d nova_mind_ai -c "SELECT now();"

# Check tables
psql -U nova_mind -d nova_mind_ai -c "\dt"

# Check logs when starting app
# Should see: "Database initialized successfully"
```

That's it! Your database is ready. Start using it in your routes.
