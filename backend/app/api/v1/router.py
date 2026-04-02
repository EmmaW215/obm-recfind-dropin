"""API Router v1"""
from fastapi import APIRouter
from app.api.v1.endpoints import programs, locations, auth, subscriptions

api_router = APIRouter()
api_router.include_router(programs.router, prefix="/programs", tags=["Programs"])
api_router.include_router(locations.router, prefix="/locations", tags=["Locations"])
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(subscriptions.router, prefix="/subscriptions", tags=["Subscriptions"])
