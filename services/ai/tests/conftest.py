"""
Shared fixtures for the Ecosfer SKDM AI Service test suite.

Provides:
- sys.path patching so `from config import ...` works in tests
- FastAPI TestClient via httpx
- Mock database session and fetch function fixtures
- Sample emission / balance / installation data factories
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any
from unittest.mock import MagicMock

import pytest

# ---------------------------------------------------------------------------
# Path setup: the AI service uses bare imports like `from config import ...`
# We need the service root on sys.path *before* any service module is imported.
# ---------------------------------------------------------------------------
AI_SERVICE_ROOT = str(Path(__file__).resolve().parent.parent)
if AI_SERVICE_ROOT not in sys.path:
    sys.path.insert(0, AI_SERVICE_ROOT)


# ---------------------------------------------------------------------------
# Sample data factories
# ---------------------------------------------------------------------------

SAMPLE_EMISSION_DATA: list[dict[str, Any]] = [
    {"id": "e1", "reportingYear": 2020, "totalCo2Emissions": 100.5, "directEmissions": 80.0, "indirectEmissions": 20.0, "aDValue": 10.0, "eFValue": 0.5, "emission_type": "CO2", "createdAt": "2020-01-01"},
    {"id": "e2", "reportingYear": 2021, "totalCo2Emissions": 120.3, "directEmissions": 90.0, "indirectEmissions": 30.0, "aDValue": 12.0, "eFValue": 0.6, "emission_type": "CO2", "createdAt": "2021-01-01"},
    {"id": "e3", "reportingYear": 2022, "totalCo2Emissions": 115.8, "directEmissions": 85.0, "indirectEmissions": 30.0, "aDValue": 11.5, "eFValue": 0.55, "emission_type": "CO2", "createdAt": "2022-01-01"},
    {"id": "e4", "reportingYear": 2023, "totalCo2Emissions": 130.0, "directEmissions": 95.0, "indirectEmissions": 35.0, "aDValue": 13.0, "eFValue": 0.65, "emission_type": "CO2", "createdAt": "2023-01-01"},
    {"id": "e5", "reportingYear": 2024, "totalCo2Emissions": 140.2, "directEmissions": 100.0, "indirectEmissions": 40.0, "aDValue": 14.0, "eFValue": 0.7, "emission_type": "CO2", "createdAt": "2024-01-01"},
]

SAMPLE_BALANCE_DATA: list[dict[str, Any]] = [
    {"id": "b1", "reportingYear": 2020, "directEmissions": 80.0, "indirectEmissions": 20.0, "totalEmissions": 100.0},
    {"id": "b2", "reportingYear": 2021, "directEmissions": 90.0, "indirectEmissions": 30.0, "totalEmissions": 120.0},
    {"id": "b3", "reportingYear": 2022, "directEmissions": 85.0, "indirectEmissions": 30.0, "totalEmissions": 115.0},
    {"id": "b4", "reportingYear": 2023, "directEmissions": 95.0, "indirectEmissions": 35.0, "totalEmissions": 130.0},
    {"id": "b5", "reportingYear": 2024, "directEmissions": 100.0, "indirectEmissions": 40.0, "totalEmissions": 140.0},
]

SAMPLE_BALANCE_DATA_MISMATCH: list[dict[str, Any]] = [
    {"id": "bm1", "reportingYear": 2023, "directEmissions": 100.0, "indirectEmissions": 50.0, "totalEmissions": 200.0},
]

SAMPLE_BALANCE_DATA_NEGATIVE: list[dict[str, Any]] = [
    {"id": "bn1", "reportingYear": 2023, "directEmissions": -10.0, "indirectEmissions": 20.0, "totalEmissions": 10.0},
]

SAMPLE_INSTALLATION_INFO: dict[str, Any] = {
    "id": "inst-1",
    "installation_name": "Test Tesis",
    "company_name": "Ecosfer A.S.",
    "country_name": "Turkiye",
}


@pytest.fixture()
def emission_data() -> list[dict[str, Any]]:
    """Five-year sample emission dataset."""
    return [row.copy() for row in SAMPLE_EMISSION_DATA]


@pytest.fixture()
def balance_data() -> list[dict[str, Any]]:
    """Five-year sample balance dataset (consistent totals)."""
    return [row.copy() for row in SAMPLE_BALANCE_DATA]


@pytest.fixture()
def balance_data_mismatch() -> list[dict[str, Any]]:
    """Balance data with a total that does not match direct + indirect."""
    return [row.copy() for row in SAMPLE_BALANCE_DATA_MISMATCH]


@pytest.fixture()
def balance_data_negative() -> list[dict[str, Any]]:
    """Balance data containing a negative emission value."""
    return [row.copy() for row in SAMPLE_BALANCE_DATA_NEGATIVE]


@pytest.fixture()
def installation_info() -> dict[str, Any]:
    return SAMPLE_INSTALLATION_INFO.copy()


# ---------------------------------------------------------------------------
# Mock DB session & dependency override
# ---------------------------------------------------------------------------

@pytest.fixture()
def mock_db() -> MagicMock:
    """A mock SQLAlchemy session (never hits a real database)."""
    return MagicMock()


@pytest.fixture()
def fastapi_client(
    emission_data: list[dict[str, Any]],
    balance_data: list[dict[str, Any]],
    installation_info: dict[str, Any],
):
    """
    httpx-based TestClient for the FastAPI app.

    All three database fetch functions are replaced with lambdas returning
    the sample fixture data so no real database connection is required.
    """
    from database import get_db
    from main import app

    # Override the DB dependency with a no-op generator
    def _override_get_db():
        yield MagicMock()

    app.dependency_overrides[get_db] = _override_get_db

    # Patch the fetch helpers at the module level where they are imported
    import main as main_module

    original_fetch_emission = main_module.fetch_emission_data
    original_fetch_installation = main_module.fetch_installation_summary
    original_fetch_balance = main_module.fetch_balance_data

    main_module.fetch_emission_data = lambda db, iid, tid: emission_data
    main_module.fetch_installation_summary = lambda db, iid, tid: installation_info
    main_module.fetch_balance_data = lambda db, iid, tid: balance_data

    from httpx import ASGITransport, AsyncClient
    # Use a synchronous test client approach via httpx
    from starlette.testclient import TestClient

    client = TestClient(app)

    yield client

    # Restore originals
    main_module.fetch_emission_data = original_fetch_emission
    main_module.fetch_installation_summary = original_fetch_installation
    main_module.fetch_balance_data = original_fetch_balance
    app.dependency_overrides.clear()
