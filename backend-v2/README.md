# RecFindOBM v2 — Web MVP

> Find drop-in recreation programs across Oakville, Burlington & Mississauga.

**Status:** 🚧 MVP Sprint 1 in progress  
**Stack:** Next.js 14 + Tailwind | FastAPI | Supabase PostgreSQL + PostGIS | Leaflet + OSM  
**Cost:** $0/month (all free tiers)

## Architecture

```
[Browser] → [Next.js 14 PWA on Vercel] → [FastAPI on Render] → [Supabase PostgreSQL + PostGIS]
                    ↓
            [Leaflet + OpenStreetMap]
```

## Quick Start

```bash
cd backend-v2
cp .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --reload
# API docs: http://localhost:8000/docs
# Run tests: pytest tests/ -v
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v1/activities/search` | Search with filters (category, age, day, cost, facility, group_by, sort) |
| GET | `/api/v1/activities/categories` | Category list with counts |
| GET | `/api/v1/activities/{id}` | Activity detail |
| GET | `/api/v1/facilities/nearby?lat=&lng=` | Nearby facilities sorted by distance |
| GET | `/api/v1/facilities/{id}` | Facility detail |

## Data

- **17 Oakville facilities** with GPS coordinates
- **1,204 drop-in activities** (Mar 24-31, 2026) from Town of Oakville PerfectMind
- **8 activity categories:** swimming, skating, sports, fitness, arts, social, court_booking, indoor_playground

## Tests

29/29 tests passing — API endpoints + service layer + haversine distance calculation
