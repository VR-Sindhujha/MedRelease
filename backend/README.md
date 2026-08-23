# MedRelease Backend

FastAPI backend foundation for MedRelease.

## Run

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env   # Windows
# cp .env.example .env  # macOS/Linux

uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs

## Current foundation

- FastAPI
- SQLAlchemy
- SQLite by default
- PostgreSQL-ready DATABASE_URL
- JWT authentication
- bcrypt password hashing
- CORS
- Pydantic validation
- Organization membership isolation
- Organization creation
- Protected organization listing
- Automated authentication test

The SCM domain modules will be added on top of this foundation.
