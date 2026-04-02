"""RecFindOBM API — FastAPI Application Entry Point

Follows: backend-patterns.md (main.py template)
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.routes import activities, facilities

logging.basicConfig(
    level=logging.INFO,
    format='{"time": "%(asctime)s", "level": "%(levelname)s", "msg": "%(message)s"}'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} v{settings.VERSION}")
    yield
    logger.info("Shutting down")


app = FastAPI(
    title=settings.APP_NAME,
    description="Find drop-in recreation programs across Oakville, Burlington & Mississauga",
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
)

# CORS — security-review: restrict origins in production
# allow_origin_regex: Vercel production + preview URLs (*.vercel.app) without listing each in env
_VERCEL_ORIGIN_RE = r"https://[a-z0-9.\-]+\.vercel\.app"
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_origin_regex=_VERCEL_ORIGIN_RE,
    allow_credentials=True,
    allow_methods=["GET", "OPTIONS"],  # OPTIONS for preflight; GET read-only MVP
    allow_headers=["*"],
)

# Routes — api-design: resource-first naming
app.include_router(activities.router, prefix="/api/v1/activities", tags=["Activities"])
app.include_router(facilities.router, prefix="/api/v1/facilities", tags=["Facilities"])


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint — API info."""
    return {"name": settings.APP_NAME, "version": settings.VERSION, "status": "operational"}


@app.get("/health", tags=["Health"])
async def health():
    """Health check — required for Render deployment monitoring."""
    return {"status": "ok", "version": settings.VERSION}
