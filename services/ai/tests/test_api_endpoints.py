"""Tests for the FastAPI API endpoints (forecast, anomalies, narrative)."""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any
from unittest.mock import MagicMock, patch

import pytest

_SERVICE_ROOT = str(Path(__file__).resolve().parent.parent)
if _SERVICE_ROOT not in sys.path:
    sys.path.insert(0, _SERVICE_ROOT)


# ---------------------------------------------------------------------------
# POST /api/v1/forecast/emissions
# ---------------------------------------------------------------------------

class TestForecastEndpoint:
    """Tests for the emission forecast API."""

    def test_forecast_returns_200(self, fastapi_client: Any) -> None:
        response = fastapi_client.post(
            "/api/v1/forecast/emissions",
            json={"installation_id": "inst-1", "periods": 3},
            headers={"X-Tenant-Id": "tenant-1"},
        )
        assert response.status_code == 200

    def test_forecast_response_structure(self, fastapi_client: Any) -> None:
        data = fastapi_client.post(
            "/api/v1/forecast/emissions",
            json={"installation_id": "inst-1", "periods": 3},
            headers={"X-Tenant-Id": "tenant-1"},
        ).json()
        assert "status" in data
        assert "message" in data
        assert "forecast" in data
        assert "historical" in data
        assert "trend" in data
        assert "confidence" in data

    def test_forecast_status_is_success(self, fastapi_client: Any) -> None:
        data = fastapi_client.post(
            "/api/v1/forecast/emissions",
            json={"installation_id": "inst-1", "periods": 2},
            headers={"X-Tenant-Id": "tenant-1"},
        ).json()
        assert data["status"] == "success"

    def test_forecast_returns_correct_number_of_periods(self, fastapi_client: Any) -> None:
        data = fastapi_client.post(
            "/api/v1/forecast/emissions",
            json={"installation_id": "inst-1", "periods": 4},
            headers={"X-Tenant-Id": "tenant-1"},
        ).json()
        assert len(data["forecast"]) == 4

    def test_forecast_missing_tenant_header_returns_422(self, fastapi_client: Any) -> None:
        response = fastapi_client.post(
            "/api/v1/forecast/emissions",
            json={"installation_id": "inst-1", "periods": 3},
        )
        assert response.status_code == 422

    def test_forecast_invalid_periods_too_high(self, fastapi_client: Any) -> None:
        response = fastapi_client.post(
            "/api/v1/forecast/emissions",
            json={"installation_id": "inst-1", "periods": 100},
            headers={"X-Tenant-Id": "tenant-1"},
        )
        assert response.status_code == 422

    def test_forecast_invalid_periods_zero(self, fastapi_client: Any) -> None:
        response = fastapi_client.post(
            "/api/v1/forecast/emissions",
            json={"installation_id": "inst-1", "periods": 0},
            headers={"X-Tenant-Id": "tenant-1"},
        )
        assert response.status_code == 422


# ---------------------------------------------------------------------------
# POST /api/v1/analysis/anomalies
# ---------------------------------------------------------------------------

class TestAnomaliesEndpoint:
    """Tests for the anomaly detection API."""

    def test_anomalies_returns_200(self, fastapi_client: Any) -> None:
        response = fastapi_client.post(
            "/api/v1/analysis/anomalies",
            json={"installation_id": "inst-1"},
            headers={"X-Tenant-Id": "tenant-1"},
        )
        assert response.status_code == 200

    def test_anomalies_response_structure(self, fastapi_client: Any) -> None:
        data = fastapi_client.post(
            "/api/v1/analysis/anomalies",
            json={"installation_id": "inst-1"},
            headers={"X-Tenant-Id": "tenant-1"},
        ).json()
        assert "status" in data
        assert "message" in data
        assert "anomalies" in data
        assert "summary" in data

    def test_anomalies_status_is_success(self, fastapi_client: Any) -> None:
        data = fastapi_client.post(
            "/api/v1/analysis/anomalies",
            json={"installation_id": "inst-1"},
            headers={"X-Tenant-Id": "tenant-1"},
        ).json()
        assert data["status"] == "success"

    def test_anomalies_summary_fields(self, fastapi_client: Any) -> None:
        data = fastapi_client.post(
            "/api/v1/analysis/anomalies",
            json={"installation_id": "inst-1"},
            headers={"X-Tenant-Id": "tenant-1"},
        ).json()
        summary = data["summary"]
        assert summary is not None
        assert "total_anomalies" in summary
        assert "data_quality_score" in summary

    def test_anomalies_missing_tenant_header_returns_422(self, fastapi_client: Any) -> None:
        response = fastapi_client.post(
            "/api/v1/analysis/anomalies",
            json={"installation_id": "inst-1"},
        )
        assert response.status_code == 422

    def test_anomalies_custom_threshold(self, fastapi_client: Any) -> None:
        response = fastapi_client.post(
            "/api/v1/analysis/anomalies",
            json={"installation_id": "inst-1", "threshold": 0.3},
            headers={"X-Tenant-Id": "tenant-1"},
        )
        assert response.status_code == 200

    def test_anomalies_invalid_threshold_too_high(self, fastapi_client: Any) -> None:
        response = fastapi_client.post(
            "/api/v1/analysis/anomalies",
            json={"installation_id": "inst-1", "threshold": 0.9},
            headers={"X-Tenant-Id": "tenant-1"},
        )
        assert response.status_code == 422


# ---------------------------------------------------------------------------
# POST /api/v1/analysis/report-narrative
# ---------------------------------------------------------------------------

class TestNarrativeEndpoint:
    """Tests for the report narrative API."""

    @patch("services.narrative_service.ANTHROPIC_API_KEY", "")
    @patch("services.narrative_service.OPENAI_API_KEY", "")
    def test_narrative_returns_200(self, fastapi_client: Any) -> None:
        response = fastapi_client.post(
            "/api/v1/analysis/report-narrative",
            json={"installation_id": "inst-1", "language": "tr"},
            headers={"X-Tenant-Id": "tenant-1"},
        )
        assert response.status_code == 200

    @patch("services.narrative_service.ANTHROPIC_API_KEY", "")
    @patch("services.narrative_service.OPENAI_API_KEY", "")
    def test_narrative_response_structure(self, fastapi_client: Any) -> None:
        data = fastapi_client.post(
            "/api/v1/analysis/report-narrative",
            json={"installation_id": "inst-1", "language": "en"},
            headers={"X-Tenant-Id": "tenant-1"},
        ).json()
        assert "status" in data
        assert "message" in data
        assert "narrative" in data
        assert "language" in data
        assert "report_type" in data

    @patch("services.narrative_service.ANTHROPIC_API_KEY", "")
    @patch("services.narrative_service.OPENAI_API_KEY", "")
    def test_narrative_template_fallback(self, fastapi_client: Any) -> None:
        data = fastapi_client.post(
            "/api/v1/analysis/report-narrative",
            json={"installation_id": "inst-1", "language": "tr"},
            headers={"X-Tenant-Id": "tenant-1"},
        ).json()
        assert data["status"] == "success"
        assert data["model"] == "template"
        assert len(data["narrative"]) > 0

    @patch("services.narrative_service.ANTHROPIC_API_KEY", "")
    @patch("services.narrative_service.OPENAI_API_KEY", "")
    def test_narrative_respects_language_param(self, fastapi_client: Any) -> None:
        data = fastapi_client.post(
            "/api/v1/analysis/report-narrative",
            json={"installation_id": "inst-1", "language": "de"},
            headers={"X-Tenant-Id": "tenant-1"},
        ).json()
        assert data["language"] == "de"
        assert "Allgemeine Bewertung" in data["narrative"]

    def test_narrative_missing_tenant_header_returns_422(self, fastapi_client: Any) -> None:
        response = fastapi_client.post(
            "/api/v1/analysis/report-narrative",
            json={"installation_id": "inst-1"},
        )
        assert response.status_code == 422

    @patch("services.narrative_service.ANTHROPIC_API_KEY", "")
    @patch("services.narrative_service.OPENAI_API_KEY", "")
    def test_narrative_default_report_type_is_summary(self, fastapi_client: Any) -> None:
        data = fastapi_client.post(
            "/api/v1/analysis/report-narrative",
            json={"installation_id": "inst-1"},
            headers={"X-Tenant-Id": "tenant-1"},
        ).json()
        assert data["report_type"] == "summary"

    @patch("services.narrative_service.ANTHROPIC_API_KEY", "")
    @patch("services.narrative_service.OPENAI_API_KEY", "")
    def test_narrative_default_language_is_tr(self, fastapi_client: Any) -> None:
        data = fastapi_client.post(
            "/api/v1/analysis/report-narrative",
            json={"installation_id": "inst-1"},
            headers={"X-Tenant-Id": "tenant-1"},
        ).json()
        assert data["language"] == "tr"


# ---------------------------------------------------------------------------
# Cross-endpoint edge cases
# ---------------------------------------------------------------------------

class TestEdgeCases:
    """Cross-cutting edge-case tests."""

    def test_empty_installation_id_still_accepted(self, fastapi_client: Any) -> None:
        """FastAPI does not validate that installation_id is non-empty."""
        response = fastapi_client.post(
            "/api/v1/forecast/emissions",
            json={"installation_id": "", "periods": 2},
            headers={"X-Tenant-Id": "tenant-1"},
        )
        # The endpoint should still return 200 (mock data is always returned)
        assert response.status_code == 200

    def test_extra_body_fields_ignored(self, fastapi_client: Any) -> None:
        response = fastapi_client.post(
            "/api/v1/forecast/emissions",
            json={"installation_id": "inst-1", "periods": 2, "extra_field": "ignored"},
            headers={"X-Tenant-Id": "tenant-1"},
        )
        assert response.status_code == 200
