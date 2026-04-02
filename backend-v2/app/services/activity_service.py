"""Activity Service — Business Logic Layer (no HTTP awareness).

Day 2 enhancement: enriches activity results with facility info.
"""
from typing import Optional, List, Dict, Any
import logging
import json
import os

logger = logging.getLogger(__name__)


class ActivityService:
    """Activity search, filtering, and retrieval. MVP uses in-memory JSON."""

    def __init__(self, data_path: Optional[str] = None, facilities_path: Optional[str] = None):
        seed_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "seed")
        self._data_path = data_path or os.path.join(seed_dir, "oakville_programs.json")
        self._fac_path = facilities_path or os.path.join(seed_dir, "oakville_facilities.json")
        self._activities: List[Dict] = []
        self._facilities: Dict[str, Dict] = {}
        self._loaded = False

    def _ensure_loaded(self):
        if not self._loaded:
            try:
                with open(self._data_path, "r") as f:
                    self._activities = json.load(f).get("activities", [])
                with open(self._fac_path, "r") as f:
                    facs = json.load(f).get("facilities", [])
                    self._facilities = {f["id"]: f for f in facs}
                self._loaded = True
                logger.info(f"Loaded {len(self._activities)} activities, {len(self._facilities)} facilities")
            except FileNotFoundError as e:
                logger.warning(f"Seed data not found: {e}")
                self._activities = []
                self._facilities = {}
                self._loaded = True

    def _enrich_activity(self, activity: Dict) -> Dict:
        """Add facility_name, address, coords to activity for frontend display."""
        fac = self._facilities.get(activity.get("facility_id", ""))
        enriched = dict(activity)
        if fac:
            enriched["facility_name"] = fac.get("name", "")
            enriched["facility_address"] = fac.get("address", "")
            enriched["facility_lat"] = fac.get("latitude")
            enriched["facility_lng"] = fac.get("longitude")
        return enriched

    async def search_activities(
        self, lat: Optional[float] = None, lng: Optional[float] = None,
        postal_code: Optional[str] = None, radius_km: int = 10,
        category: Optional[List[str]] = None, age_group: Optional[List[str]] = None,
        day: Optional[List[str]] = None, cost_type: Optional[str] = None,
        facility_id: Optional[str] = None, sort_by: str = "time",
        group_by: Optional[str] = None, page: int = 1, page_size: int = 50,
    ) -> Dict[str, Any]:
        """Search activities with filters, returns enriched results."""
        self._ensure_loaded()
        results = list(self._activities)

        if category:
            results = [a for a in results if a.get("category") in category]
        if age_group:
            results = [a for a in results if a.get("age_group") in age_group]
        if day:
            results = [a for a in results if a.get("date") in day]
        if cost_type:
            results = [a for a in results if a.get("cost_type") == cost_type]
        if facility_id:
            results = [a for a in results if a.get("facility_id") == facility_id]

        if sort_by == "time":
            results.sort(key=lambda a: (a.get("date", ""), a.get("start_time", "")))
        elif sort_by == "cost":
            results.sort(key=lambda a: a.get("cost_amount", 0))

        total = len(results)

        grouped = None
        if group_by and group_by in ("facility", "category", "day"):
            grouped = {}
            group_key = {"facility": "facility_id", "category": "category", "day": "date"}[group_by]
            for a in results:
                key = a.get(group_key, "unknown")
                grouped.setdefault(key, []).append(self._enrich_activity(a))

        start = (page - 1) * page_size
        end = start + page_size
        page_results = [self._enrich_activity(a) for a in results[start:end]]

        return {
            "data": page_results,
            "grouped": grouped,
            "meta": {
                "total": total, "page": page, "page_size": page_size,
                "has_next": end < total,
                "filters_applied": {
                    "category": category, "age_group": age_group,
                    "day": day, "cost_type": cost_type, "facility_id": facility_id,
                },
            },
        }

    async def get_activity_by_id(self, activity_id: str) -> Optional[Dict]:
        """Get a single activity by ID, enriched with facility info."""
        self._ensure_loaded()
        for a in self._activities:
            if a.get("id") == activity_id:
                return {"data": self._enrich_activity(a)}
        return None

    async def get_categories(self) -> Dict[str, Any]:
        """Get list of categories with activity counts."""
        self._ensure_loaded()
        counts = {}
        for a in self._activities:
            cat = a.get("category", "other")
            counts[cat] = counts.get(cat, 0) + 1
        categories = [{"id": c, "count": n} for c, n in sorted(counts.items(), key=lambda x: -x[1])]
        return {"data": categories, "meta": {"total": len(categories)}}
