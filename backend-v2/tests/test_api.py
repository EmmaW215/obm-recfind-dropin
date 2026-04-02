"""Activity API Endpoint Tests — tdd-workflow.md"""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestHealthEndpoint:

    def test_health_returns_200(self):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

    def test_root_returns_app_info(self):
        response = client.get("/")
        assert response.status_code == 200
        assert "RecFindOBM" in response.json()["name"]


class TestActivitySearch:

    def test_search_returns_200_with_data(self):
        response = client.get("/api/v1/activities/search")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "meta" in data
        assert isinstance(data["data"], list)

    def test_search_filter_by_category(self):
        response = client.get("/api/v1/activities/search?category=swimming")
        assert response.status_code == 200
        for a in response.json()["data"]:
            assert a["category"] == "swimming"

    def test_search_filter_by_cost_free(self):
        response = client.get("/api/v1/activities/search?cost_type=free")
        assert response.status_code == 200
        for a in response.json()["data"]:
            assert a["cost_type"] == "free"

    def test_search_filter_by_facility(self):
        response = client.get("/api/v1/activities/search?facility_id=glen_abbey_cc")
        assert response.status_code == 200
        for a in response.json()["data"]:
            assert a["facility_id"] == "glen_abbey_cc"

    def test_search_pagination(self):
        response = client.get("/api/v1/activities/search?page=1&page_size=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) <= 5
        assert data["meta"]["page"] == 1
        assert data["meta"]["page_size"] == 5

    def test_search_group_by_facility(self):
        response = client.get("/api/v1/activities/search?group_by=facility")
        assert response.status_code == 200
        data = response.json()
        assert data["grouped"] is not None

    def test_search_invalid_page_size(self):
        response = client.get("/api/v1/activities/search?page_size=99999")
        assert response.status_code == 422


class TestActivityDetail:

    def test_get_activity_not_found(self):
        response = client.get("/api/v1/activities/nonexistent_id_999")
        assert response.status_code == 404


class TestCategories:

    def test_categories_returns_list(self):
        response = client.get("/api/v1/activities/categories")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert isinstance(data["data"], list)
        assert len(data["data"]) > 0


class TestFacilityNearby:

    def test_nearby_returns_200(self):
        response = client.get("/api/v1/facilities/nearby?lat=43.44&lng=-79.68")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert len(data["data"]) > 0

    def test_nearby_sorted_by_distance(self):
        response = client.get("/api/v1/facilities/nearby?lat=43.44&lng=-79.68")
        data = response.json()
        distances = [f["distance_km"] for f in data["data"]]
        assert distances == sorted(distances)

    def test_nearby_missing_coords_returns_422(self):
        response = client.get("/api/v1/facilities/nearby")
        assert response.status_code == 422

    def test_nearby_with_type_filter(self):
        response = client.get(
            "/api/v1/facilities/nearby?lat=43.44&lng=-79.68&facility_type=community_center"
        )
        assert response.status_code == 200
        for f in response.json()["data"]:
            assert f["facility_type"] == "community_center"


class TestFacilityDetail:

    def test_facility_not_found(self):
        response = client.get("/api/v1/facilities/nonexistent_id")
        assert response.status_code == 404
