"""
OBM RecFind Drop-In - FastAPI Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api.v1.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"Starting {settings.APP_NAME} v{settings.VERSION}")
    yield
    print("Shutting down")

app = FastAPI(
    title=settings.APP_NAME,
    description="API for finding drop-in recreation programs",
    version=settings.VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"name": settings.APP_NAME, "version": settings.VERSION, "status": "operational"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
