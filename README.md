# OBM RecFind Drop-In

Find drop-in recreation programs across Oakville, Burlington & Mississauga.

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Mobile App
```bash
cd mobile
npm install
npx expo start
```

### Web MVP API (`backend-v2`)
Read-only FastAPI for the web product and seed data. See [`backend-v2/README.md`](backend-v2/README.md).

```bash
cd backend-v2
cp .env.example .env
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
pytest tests/ -v
```

- **`db/migrations/`** — PostgreSQL schema (PostGIS) for production deployments.
- **`data/seed/`** — Oakville facilities, categories, and programs JSON for local development and tests.

## Features

### Free Tier
- Browse programs in Oakville or Burlington
- Basic filters and 3-day date range

### Premium ($3.99/mo or $29.99/yr)
- All 3 cities including Mississauga
- Calendar view and real-time data
- Favorites, notifications, and no ads
