"""Tests for services/forecast_service.py."""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

import numpy as np
import pytest

# Ensure service root is on path (conftest also does this, but be explicit)
_SERVICE_ROOT = str(Path(__file__).resolve().parent.parent)
if _SERVICE_ROOT not in sys.path:
    sys.path.insert(0, _SERVICE_ROOT)

from services.forecast_service import (
    _aggregate_by_year,
    _calculate_trend,
    _linear_forecast,
    forecast_emissions,
)


# ---------------------------------------------------------------------------
# forecast_emissions - top-level function
# ---------------------------------------------------------------------------

class TestForecastEmissions:
    """Tests for the main forecast_emissions entry point."""

    def test_empty_data_returns_no_data(self) -> None:
        result = forecast_emissions([], periods=6)
        assert result["status"] == "no_data"
        assert result["forecast"] == []
        assert result["trend"] is None
        assert result["confidence"] is None

    def test_insufficient_data_with_one_year(self) -> None:
        data = [
            {"reportingYear": 2024, "totalCo2Emissions": 100.0},
        ]
        result = forecast_emissions(data, periods=6)
        assert result["status"] == "insufficient_data"
        assert "1" in result["message"]  # "mevcut: 1"
        assert result["forecast"] == []
        assert result["historical"] is not None

    def test_insufficient_data_with_two_years(self) -> None:
        data = [
            {"reportingYear": 2023, "totalCo2Emissions": 100.0},
            {"reportingYear": 2024, "totalCo2Emissions": 110.0},
        ]
        result = forecast_emissions(data, periods=6)
        assert result["status"] == "insufficient_data"
        assert result["forecast"] == []

    def test_valid_data_returns_success(self, emission_data: list[dict[str, Any]]) -> None:
        result = forecast_emissions(emission_data, periods=3)
        assert result["status"] == "success"
        assert len(result["forecast"]) == 3
        assert result["trend"] is not None
        assert result["confidence"] is not None
        assert result["model"] is not None

    def test_predictions_have_correct_structure(self, emission_data: list[dict[str, Any]]) -> None:
        result = forecast_emissions(emission_data, periods=4)
        for pred in result["forecast"]:
            assert "year" in pred
            assert "predicted" in pred
            assert "lower_bound" in pred
            assert "upper_bound" in pred
            assert isinstance(pred["year"], int)
            assert isinstance(pred["predicted"], float)
            assert isinstance(pred["lower_bound"], float)
            assert isinstance(pred["upper_bound"], float)

    def test_predictions_are_non_negative(self, emission_data: list[dict[str, Any]]) -> None:
        result = forecast_emissions(emission_data, periods=6)
        for pred in result["forecast"]:
            assert pred["predicted"] >= 0
            assert pred["lower_bound"] >= 0

    def test_forecast_years_are_consecutive_after_last_historical(
        self, emission_data: list[dict[str, Any]]
    ) -> None:
        result = forecast_emissions(emission_data, periods=3)
        # Historical last year is 2024
        forecast_years = [p["year"] for p in result["forecast"]]
        assert forecast_years == [2025, 2026, 2027]

    def test_historical_data_is_returned(self, emission_data: list[dict[str, Any]]) -> None:
        result = forecast_emissions(emission_data, periods=2)
        assert "historical" in result
        assert len(result["historical"]) == 5
        for h in result["historical"]:
            assert "year" in h
            assert "emissions" in h

    def test_trend_present_for_valid_data(self, emission_data: list[dict[str, Any]]) -> None:
        result = forecast_emissions(emission_data, periods=2)
        trend = result["trend"]
        assert trend is not None
        assert trend["direction"] in ("increasing", "decreasing", "stable")
        assert "change_pct" in trend
        assert "avg_annual_change" in trend
        assert "slope" in trend

    def test_confidence_present_for_valid_data(self, emission_data: list[dict[str, Any]]) -> None:
        result = forecast_emissions(emission_data, periods=2)
        conf = result["confidence"]
        assert conf is not None
        assert "level" in conf
        assert "method" in conf
        assert conf["level"] == 0.90

    def test_r2_score_returned(self, emission_data: list[dict[str, Any]]) -> None:
        result = forecast_emissions(emission_data, periods=2)
        assert "r2_score" in result
        assert result["r2_score"] is not None
        assert isinstance(result["r2_score"], float)


# ---------------------------------------------------------------------------
# _aggregate_by_year
# ---------------------------------------------------------------------------

class TestAggregateByYear:
    """Tests for the _aggregate_by_year helper."""

    def test_groups_by_year(self) -> None:
        data = [
            {"reportingYear": 2023, "totalCo2Emissions": 50.0},
            {"reportingYear": 2023, "totalCo2Emissions": 30.0},
            {"reportingYear": 2024, "totalCo2Emissions": 100.0},
        ]
        result = _aggregate_by_year(data)
        assert len(result) == 2
        # First tuple is 2023
        assert result[0] == (2023, 80.0)
        assert result[1] == (2024, 100.0)

    def test_returns_sorted_by_year(self) -> None:
        data = [
            {"reportingYear": 2024, "totalCo2Emissions": 100.0},
            {"reportingYear": 2020, "totalCo2Emissions": 50.0},
            {"reportingYear": 2022, "totalCo2Emissions": 70.0},
        ]
        result = _aggregate_by_year(data)
        years = [y for y, _ in result]
        assert years == sorted(years)

    def test_falls_back_to_direct_emissions(self) -> None:
        """When totalCo2Emissions is None, directEmissions is used."""
        data = [
            {"reportingYear": 2023, "totalCo2Emissions": None, "directEmissions": 42.0},
        ]
        result = _aggregate_by_year(data)
        assert len(result) == 1
        assert result[0] == (2023, 42.0)

    def test_skips_rows_without_year(self) -> None:
        data = [
            {"reportingYear": None, "totalCo2Emissions": 100.0},
            {"reportingYear": 2023, "totalCo2Emissions": 50.0},
        ]
        result = _aggregate_by_year(data)
        assert len(result) == 1

    def test_skips_rows_with_zero_emissions(self) -> None:
        data = [
            {"reportingYear": 2023, "totalCo2Emissions": 0},
            {"reportingYear": 2024, "totalCo2Emissions": 50.0},
        ]
        result = _aggregate_by_year(data)
        assert len(result) == 1
        assert result[0][0] == 2024

    def test_empty_list(self) -> None:
        assert _aggregate_by_year([]) == []

    def test_handles_string_values(self) -> None:
        """Year and emissions can be strings that are parseable."""
        data = [
            {"reportingYear": "2023", "totalCo2Emissions": "99.5"},
        ]
        result = _aggregate_by_year(data)
        assert len(result) == 1
        assert result[0] == (2023, 99.5)


# ---------------------------------------------------------------------------
# _calculate_trend
# ---------------------------------------------------------------------------

class TestCalculateTrend:
    """Tests for trend direction / statistics calculation."""

    def test_increasing_trend(self) -> None:
        years = np.array([2020, 2021, 2022, 2023, 2024])
        emissions = np.array([100.0, 110.0, 120.0, 130.0, 140.0])
        trend = _calculate_trend(years, emissions)
        assert trend["direction"] == "increasing"
        assert trend["change_pct"] > 0
        assert trend["slope"] is not None
        assert trend["slope"] > 0

    def test_decreasing_trend(self) -> None:
        years = np.array([2020, 2021, 2022, 2023, 2024])
        emissions = np.array([140.0, 130.0, 120.0, 110.0, 100.0])
        trend = _calculate_trend(years, emissions)
        assert trend["direction"] == "decreasing"
        assert trend["change_pct"] < 0
        assert trend["slope"] < 0

    def test_stable_trend(self) -> None:
        years = np.array([2020, 2021, 2022])
        emissions = np.array([100.0, 100.0, 100.0])
        trend = _calculate_trend(years, emissions)
        assert trend["direction"] == "stable"
        assert trend["change_pct"] == 0.0
        assert trend["slope"] == 0.0

    def test_single_data_point(self) -> None:
        years = np.array([2024])
        emissions = np.array([100.0])
        trend = _calculate_trend(years, emissions)
        assert trend["direction"] == "unknown"

    def test_avg_annual_change(self) -> None:
        years = np.array([2020, 2024])
        emissions = np.array([100.0, 140.0])
        trend = _calculate_trend(years, emissions)
        # (140-100) / (2024-2020) = 10.0
        assert trend["avg_annual_change"] == 10.0


# ---------------------------------------------------------------------------
# _linear_forecast (deterministic fallback)
# ---------------------------------------------------------------------------

class TestLinearForecast:
    """Tests for the linear regression fallback."""

    def test_returns_correct_number_of_predictions(self) -> None:
        years = np.array([2020, 2021, 2022, 2023, 2024])
        emissions = np.array([100.0, 110.0, 120.0, 130.0, 140.0])
        result = _linear_forecast(years, emissions, periods=3)
        assert len(result["predictions"]) == 3

    def test_model_name_is_linear_regression(self) -> None:
        years = np.array([2020, 2021, 2022, 2023, 2024])
        emissions = np.array([100.0, 110.0, 120.0, 130.0, 140.0])
        result = _linear_forecast(years, emissions, periods=2)
        assert result["model"] == "LinearRegression"

    def test_confidence_method_is_residual_std(self) -> None:
        years = np.array([2020, 2021, 2022, 2023, 2024])
        emissions = np.array([100.0, 110.0, 120.0, 130.0, 140.0])
        result = _linear_forecast(years, emissions, periods=2)
        assert result["confidence"]["method"] == "residual_std"

    def test_perfect_linear_data_has_r2_of_1(self) -> None:
        years = np.array([2020, 2021, 2022, 2023, 2024])
        emissions = np.array([100.0, 110.0, 120.0, 130.0, 140.0])
        result = _linear_forecast(years, emissions, periods=2)
        assert result["r2_score"] == pytest.approx(1.0, abs=0.01)

    def test_lower_bound_not_greater_than_predicted(self) -> None:
        years = np.array([2020, 2021, 2022, 2023, 2024])
        emissions = np.array([100.0, 115.0, 108.0, 130.0, 140.0])
        result = _linear_forecast(years, emissions, periods=3)
        for pred in result["predictions"]:
            assert pred["lower_bound"] <= pred["predicted"]

    def test_upper_bound_not_less_than_predicted(self) -> None:
        years = np.array([2020, 2021, 2022, 2023, 2024])
        emissions = np.array([100.0, 115.0, 108.0, 130.0, 140.0])
        result = _linear_forecast(years, emissions, periods=3)
        for pred in result["predictions"]:
            assert pred["upper_bound"] >= pred["predicted"]
