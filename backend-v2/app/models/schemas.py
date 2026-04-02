"""Pydantic Request/Response Models — api-design.md response contracts."""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class ActivityItem(BaseModel):
    id: str
    program_id: Optional[str] = None
    name: str
    category: str
    age_group: str
    facility_id: str
    facility_name: Optional[str] = None
    facility_address: Optional[str] = None
    facility_lat: Optional[float] = None
    facility_lng: Optional[float] = None
    room: Optional[str] = None
    date: str
    start_time: str
    end_time: str
    cost_amount: float = 0.0
    cost_type: str = "free"
    spots_left: Optional[int] = None
    is_full: bool = False
    activity_type: str = "drop_in"
    source_category: Optional[str] = None


class PaginationMeta(BaseModel):
    total: int
    page: int
    page_size: int
    has_next: bool
    filters_applied: Optional[Dict[str, Any]] = None


class ActivitySearchResponse(BaseModel):
    data: List[ActivityItem]
    grouped: Optional[Dict[str, List[ActivityItem]]] = None
    meta: PaginationMeta


class ActivityDetailResponse(BaseModel):
    data: ActivityItem


class CategoryItem(BaseModel):
    id: str
    count: int


class CategoryListResponse(BaseModel):
    data: List[CategoryItem]
    meta: Dict[str, int]


class FacilityItem(BaseModel):
    id: str
    name: str
    facility_type: str
    address: str
    latitude: float
    longitude: float
    phone: Optional[str] = None
    website_url: Optional[str] = None
    amenities: Optional[List[str]] = None
    has_pool: bool = False
    has_arena: bool = False
    has_fitness: bool = False
    distance_km: Optional[float] = None
    notes: Optional[str] = None


class FacilityListResponse(BaseModel):
    data: List[FacilityItem]
    meta: Dict[str, Any]


class FacilityDetailResponse(BaseModel):
    data: FacilityItem


class ErrorResponse(BaseModel):
    detail: str
