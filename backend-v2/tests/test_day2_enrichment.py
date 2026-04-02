"""Day 2 Tests — Activity enrichment with facility info + multi-filter + data integrity."""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.activity_service import ActivityService

client = TestClient(app)


class TestActivityEnrichment:
    def test_search_results_include_facility_name(self):
        response = client.get("/api/v1/activities/search?category=swimming&page_size=3")
        assert response.status_code == 200
        for activity in response.json()["data"]:
            assert "facility_name" in activity
            assert activity["facility_name"]
            assert "facility_address" in activity

    def test_search_results_include_facility_coords(self):
        response = client.get("/api/v1/activities/search?category=skating&page_size=3")
        assert response.status_code == 200
        for activity in response.json()["data"]:
            assert activity.get("facility_lat") is not None
            assert activity.get("facility_lng") is not None

    def test_activity_detail_includes_facility_info(self):
        search = client.get("/api/v1/activities/search?page_size=1")
        activity_id = search.json()["data"][0]["id"]
        response = client.get(f"/api/v1/activities/{activity_id}")
        assert response.status_code == 200
        data = response.json()["data"]
        assert data["facility_name"]
        assert data["facility_lat"] is not None

    @pytest.mark.asyncio
    async def test_service_enrichment_adds_facility_name(self):
        service = ActivityService()
        result = await service.search_activities(category=["sports"], page_size=5)
        for a in result["data"]:
            assert "facility_name" in a

    def test_grouped_results_also_enriched(self):
        response = client.get("/api/v1/activities/search?group_by=facility&category=swimming")
        data = response.json()
        assert data["grouped"] is not None
        for group_key, activities in data["grouped"].items():
            for a in activities:
                assert "facility_name" in a


class TestMultiFilter:
    def test_category_plus_age(self):
        response = client.get("/api/v1/activities/search?category=sports&age_group=adult")
        assert response.status_code == 200
        for a in response.json()["data"]:
            assert a["category"] == "sports"
            assert a["age_group"] == "adult"

    def test_facility_plus_category(self):
        response = client.get("/api/v1/activities/search?facility_id=glen_abbey_cc&category=skating")
        assert response.status_code == 200
        for a in response.json()["data"]:
            assert a["facility_id"] == "glen_abbey_cc"
            assert a["category"] == "skating"

    def test_free_swimming(self):
        response = client.get("/api/v1/activities/search?category=swimming&cost_type=free")
        assert response.status_code == 200
        for a in response.json()["data"]:
            assert a["category"] == "swimming"
            assert a["cost_type"] == "free"

    def test_empty_result_returns_empty_list(self):
        response = client.get("/api/v1/activities/search?category=swimming&facility_id=kinoak_arena")
        assert response.status_code == 200
        assert response.json()["data"] == []
        assert response.json()["meta"]["total"] == 0


class TestSeedDataIntegrity:
    def test_all_17_facilities_loaded(self):
        response = client.get("/api/v1/facilities/nearby?lat=43.44&lng=-79.68&radius_km=50")
        assert response.status_code == 200
        assert len(response.json()["data"]) == 17

    def test_total_activities_count(self):
        response = client.get("/api/v1/activities/search?page_size=1")
        assert response.json()["meta"]["total"] == 1204

    def test_all_categories_present(self):
        response = client.get("/api/v1/activities/categories")
        cat_ids = [c["id"] for c in response.json()["data"]]
        expected = ["court_booking", "fitness", "swimming", "sports", "social", "skating", "arts", "indoor_playground"]
        for exp in expected:
            assert exp in cat_ids, f"Missing category: {exp}"
