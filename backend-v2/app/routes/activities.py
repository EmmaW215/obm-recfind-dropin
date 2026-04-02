"""Activities API Routes — HTTP layer only, logic in services."""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
import logging

from app.services.activity_service import ActivityService
from app.models.schemas import (
    ActivitySearchResponse, ActivityDetailResponse,
    CategoryListResponse, ErrorResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter()
activity_service = ActivityService()


@router.get(
    "/search", response_model=ActivitySearchResponse,
    summary="Search drop-in activities",
    responses={400: {"model": ErrorResponse}},
)
async def search_activities(
    lat: Optional[float] = Query(None, description="User latitude"),
    lng: Optional[float] = Query(None, description="User longitude"),
    postal_code: Optional[str] = Query(None, description="Canadian postal code"),
    radius_km: int = Query(10, ge=1, le=50, description="Search radius in km"),
    category: Optional[List[str]] = Query(None, description="Filter by category"),
    age_group: Optional[List[str]] = Query(None, description="Filter by age group"),
    day: Optional[List[str]] = Query(None, description="Filter by date YYYY-MM-DD"),
    cost_type: Optional[str] = Query(None, description="free or paid"),
    facility_id: Optional[str] = Query(None, description="Filter by facility"),
    sort_by: str = Query("time", description="Sort: time, distance, cost"),
    group_by: Optional[str] = Query(None, description="Group: facility, category, day"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=5000, description="Results per page (large values for map sync)"),
):
    try:
        return await activity_service.search_activities(
            lat=lat, lng=lng, postal_code=postal_code, radius_km=radius_km,
            category=category, age_group=age_group, day=day, cost_type=cost_type,
            facility_id=facility_id, sort_by=sort_by, group_by=group_by,
            page=page, page_size=page_size,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Search error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/categories", response_model=CategoryListResponse, summary="List categories")
async def list_categories():
    try:
        return await activity_service.get_categories()
    except Exception as e:
        logger.error(f"Categories error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get(
    "/{activity_id}", response_model=ActivityDetailResponse,
    summary="Get activity detail",
    responses={404: {"model": ErrorResponse}},
)
async def get_activity(activity_id: str):
    try:
        result = await activity_service.get_activity_by_id(activity_id)
        if not result:
            raise HTTPException(status_code=404, detail=f"Activity {activity_id} not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Activity detail error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
