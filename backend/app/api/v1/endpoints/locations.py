"""Locations API"""
from fastapi import APIRouter, Query
from typing import Optional, List
from pydantic import BaseModel

router = APIRouter()


@router.get("")
async def get_locations(city: Optional[str] = None):
    """Get all community centers from scraper service."""
    from app.services.scraper_service import scraper_service
    
    if city:
        locations = await scraper_service.get_locations(city.lower())
        return [{"city": city.lower(), **loc} for loc in locations]
    
    # Return all locations from all cities
    results = []
    for city_name in ["oakville", "burlington", "mississauga"]:
        locations = await scraper_service.get_locations(city_name)
        for loc in locations:
            results.append({"city": city_name, **loc})
    return results


@router.get("/cities")
async def get_cities():
    """Get list of supported cities."""
    return [
        {"id": "oakville", "name": "Oakville"},
        {"id": "burlington", "name": "Burlington"},
        {"id": "mississauga", "name": "Mississauga"},
    ]


@router.get("/activity-types")
async def get_activity_types():
    """Get list of activity types."""
    return [
        {"id": "fitness", "name": "Fitness"},
        {"id": "swim", "name": "Swimming"},
        {"id": "skating", "name": "Skating & Hockey"},
        {"id": "sports", "name": "Sports"},
        {"id": "other", "name": "Others"},
    ]


@router.get("/age-groups")
async def get_age_groups():
    """Get list of age groups."""
    return [
        {"id": "adult", "name": "Adult"},
        {"id": "senior", "name": "Seniors"},
        {"id": "youth", "name": "Youth"},
        {"id": "child", "name": "Children"},
        {"id": "family", "name": "Family/All Ages"},
    ]
