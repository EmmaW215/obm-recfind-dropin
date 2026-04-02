"""Facility Service — Business Logic Layer. MVP uses in-memory JSON + haversine."""
from typing import Optional, List, Dict, Any
import logging
import json
import os
import math

logger = logging.getLogger(__name__)


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance between two GPS points in km (Haversine formula)."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2))
         * math.sin(dlon / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


class FacilityService:
    """Facility lookup and proximity queries."""

    def __init__(self, data_path: Optional[str] = None):
        self._data_path = data_path or os.path.join(
            os.path.dirname(__file__), "..", "..", "..", "data", "seed", "oakville_facilities.json"
        )
        self._facilities: List[Dict] = []
        self._loaded = False

    def _ensure_loaded(self):
        if not self._loaded:
            try:
                with open(self._data_path, "r") as f:
                    data = json.load(f)
                self._facilities = data.get("facilities", [])
                self._loaded = True
                logger.info(f"Loaded {len(self._facilities)} facilities")
            except FileNotFoundError:
                logger.warning(f"Facility data not found at {self._data_path}")
                self._facilities = []
                self._loaded = True

    async def get_nearby(
        self, lat: float, lng: float, radius_km: int = 10,
        facility_type: Optional[List[str]] = None, limit: int = 20,
    ) -> Dict[str, Any]:
        self._ensure_loaded()
        results = []
        for f in self._facilities:
            dist = haversine_km(lat, lng, f["latitude"], f["longitude"])
            if dist <= radius_km:
                if facility_type and f.get("facility_type") not in facility_type:
                    continue
                results.append({**f, "distance_km": round(dist, 2)})
        results.sort(key=lambda x: x["distance_km"])
        results = results[:limit]
        return {
            "data": results,
            "meta": {"total": len(results), "center": {"lat": lat, "lng": lng}, "radius_km": radius_km},
        }

    async def get_facility_by_id(self, facility_id: str) -> Optional[Dict]:
        self._ensure_loaded()
        for f in self._facilities:
            if f.get("id") == facility_id:
                return {"data": f}
        return None
