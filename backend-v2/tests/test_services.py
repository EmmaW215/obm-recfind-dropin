"""Service Layer Unit Tests — tdd-workflow.md"""
import pytest
from app.services.activity_service import ActivityService
from app.services.facility_service import FacilityService, haversine_km


class TestHaversine:
    def test_same_point_returns_zero(self):
        assert haversine_km(43.44, -79.68, 43.44, -79.68) == 0.0

    def test_known_distance_oakville(self):
        """Glen Abbey CC to Iroquois Ridge CC is ~3-4 km."""
        dist = haversine_km(43.4308, -79.7178, 43.4485, -79.6877)
        assert 2.0 < dist < 5.0

    def test_large_distance(self):
        """Oakville to Toronto is ~35-45 km."""
        dist = haversine_km(43.44, -79.68, 43.65, -79.38)
        assert 25 < dist < 50


class TestActivityService:
    @pytest.mark.asyncio
    async def test_search_returns_dict_with_data_and_meta(self):
        service = ActivityService()
        result = await service.search_activities()
        assert "data" in result
        assert "meta" in result
        assert isinstance(result["data"], list)

    @pytest.mark.asyncio
    async def test_search_filter_by_category(self):
        service = ActivityService()
        result = await service.search_activities(category=["swimming"])
        for a in result["data"]:
            assert a["category"] == "swimming"

    @pytest.mark.asyncio
    async def test_search_pagination(self):
        service = ActivityService()
        result = await service.search_activities(page=1, page_size=5)
        assert len(result["data"]) <= 5
        assert result["meta"]["page"] == 1

    @pytest.mark.asyncio
    async def test_search_group_by_category(self):
        service = ActivityService()
        result = await service.search_activities(group_by="category")
        assert result["grouped"] is not None
        assert isinstance(result["grouped"], dict)

    @pytest.mark.asyncio
    async def test_get_nonexistent_activity_returns_none(self):
        service = ActivityService()
        result = await service.get_activity_by_id("does_not_exist")
        assert result is None

    @pytest.mark.asyncio
    async def test_get_categories_returns_list(self):
        service = ActivityService()
        result = await service.get_categories()
        assert "data" in result
        assert len(result["data"]) > 0


class TestFacilityService:
    @pytest.mark.asyncio
    async def test_nearby_returns_facilities(self):
        service = FacilityService()
        result = await service.get_nearby(lat=43.44, lng=-79.68)
        assert "data" in result
        assert len(result["data"]) > 0

    @pytest.mark.asyncio
    async def test_nearby_sorted_by_distance(self):
        service = FacilityService()
        result = await service.get_nearby(lat=43.44, lng=-79.68)
        distances = [f["distance_km"] for f in result["data"]]
        assert distances == sorted(distances)

    @pytest.mark.asyncio
    async def test_nearby_respects_radius(self):
        service = FacilityService()
        result = await service.get_nearby(lat=43.44, lng=-79.68, radius_km=1)
        for f in result["data"]:
            assert f["distance_km"] <= 1.0

    @pytest.mark.asyncio
    async def test_get_nonexistent_facility_returns_none(self):
        service = FacilityService()
        result = await service.get_facility_by_id("does_not_exist")
        assert result is None
