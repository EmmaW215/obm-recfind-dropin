"""Facilities API Routes — HTTP layer only, logic in services."""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
import logging

from app.services.facility_service import FacilityService
from app.models.schemas import FacilityListResponse, FacilityDetailResponse, ErrorResponse

logger = logging.getLogger(__name__)
router = APIRouter()
facility_service = FacilityService()


@router.get(
    "/nearby", response_model=FacilityListResponse,
    summary="Find nearby facilities",
    responses={400: {"model": ErrorResponse}},
)
async def get_nearby_facilities(
    lat: float = Query(..., description="User latitude"),
    lng: float = Query(..., description="User longitude"),
    radius_km: int = Query(10, ge=1, le=50, description="Search radius in km"),
    facility_type: Optional[List[str]] = Query(None, description="Filter by type"),
    limit: int = Query(20, ge=1, le=50, description="Max results"),
):
    try:
        return await facility_service.get_nearby(
            lat=lat, lng=lng, radius_km=radius_km,
            facility_type=facility_type, limit=limit,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Nearby error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get(
    "/{facility_id}", response_model=FacilityDetailResponse,
    summary="Get facility detail",
    responses={404: {"model": ErrorResponse}},
)
async def get_facility(facility_id: str):
    try:
        result = await facility_service.get_facility_by_id(facility_id)
        if not result:
            raise HTTPException(status_code=404, detail=f"Facility {facility_id} not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Facility detail error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
