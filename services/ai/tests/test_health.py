"""Tests for the /health endpoint."""

from __future__ import annotations

from datetime import datetime
from typing import Any


class TestHealthEndpoint:
    """Verify the health-check endpoint responds correctly."""

    def test_health_returns_200(self, fastapi_client: Any) -> None:
        response = fastapi_client.get("/health")
        assert response.status_code == 200

    def test_health_contains_required_fields(self, fastapi_client: Any) -> None:
        data = fastapi_client.get("/health").json()
        assert "status" in data
        assert "service" in data
        assert "version" in data
        assert "timestamp" in data

    def test_health_status_is_healthy(self, fastapi_client: Any) -> None:
        data = fastapi_client.get("/health").json()
        assert data["status"] == "healthy"

    def test_health_service_name(self, fastapi_client: Any) -> None:
        data = fastapi_client.get("/health").json()
        assert data["service"] == "ecosfer-ai"

    def test_health_version(self, fastapi_client: Any) -> None:
        data = fastapi_client.get("/health").json()
        assert data["version"] == "2.0.0"

    def test_health_timestamp_is_valid_iso(self, fastapi_client: Any) -> None:
        data = fastapi_client.get("/health").json()
        # Should be parseable as an ISO-8601 datetime string
        ts = data["timestamp"]
        parsed = datetime.fromisoformat(ts)
        assert isinstance(parsed, datetime)
