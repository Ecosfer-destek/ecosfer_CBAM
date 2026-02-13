"""Tests for services/anomaly_service.py."""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

import pytest

_SERVICE_ROOT = str(Path(__file__).resolve().parent.parent)
if _SERVICE_ROOT not in sys.path:
    sys.path.insert(0, _SERVICE_ROOT)

from services.anomaly_service import (
    _calculate_quality_score,
    _cross_validate,
    _detect_balance_anomalies,
    _safe_float,
    _score_to_severity,
    detect_anomalies,
)


# ---------------------------------------------------------------------------
# detect_anomalies - top-level function
# ---------------------------------------------------------------------------

class TestDetectAnomalies:
    """Tests for the main detect_anomalies entry point."""

    def test_empty_data_returns_no_data(self) -> None:
        result = detect_anomalies([], [], threshold=0.05)
        assert result["status"] == "no_data"
        assert result["anomalies"] == []
        assert result["summary"] is None

    def test_valid_data_returns_success(
        self,
        emission_data: list[dict[str, Any]],
        balance_data: list[dict[str, Any]],
    ) -> None:
        result = detect_anomalies(emission_data, balance_data, threshold=0.05)
        assert result["status"] == "success"
        assert "anomalies" in result
        assert "summary" in result

    def test_summary_structure(
        self,
        emission_data: list[dict[str, Any]],
        balance_data: list[dict[str, Any]],
    ) -> None:
        result = detect_anomalies(emission_data, balance_data, threshold=0.05)
        summary = result["summary"]
        assert summary is not None
        assert "total_anomalies" in summary
        assert "critical" in summary
        assert "warning" in summary
        assert "info" in summary
        assert "data_quality_score" in summary
        assert isinstance(summary["data_quality_score"], float)
        assert 0 <= summary["data_quality_score"] <= 100

    def test_anomalies_sorted_by_severity_descending(
        self,
        emission_data: list[dict[str, Any]],
        balance_data_mismatch: list[dict[str, Any]],
    ) -> None:
        result = detect_anomalies(emission_data, balance_data_mismatch, threshold=0.3)
        anomalies = result["anomalies"]
        if len(anomalies) >= 2:
            scores = [a["severity_score"] for a in anomalies]
            assert scores == sorted(scores, reverse=True)


# ---------------------------------------------------------------------------
# Balance mismatch detection
# ---------------------------------------------------------------------------

class TestBalanceMismatch:
    """Detect when total != direct + indirect."""

    def test_mismatch_detected(self, balance_data_mismatch: list[dict[str, Any]]) -> None:
        anomalies = _detect_balance_anomalies(balance_data_mismatch, threshold=0.05)
        mismatch = [a for a in anomalies if a["type"] == "balance_mismatch"]
        assert len(mismatch) >= 1
        assert mismatch[0]["source"] == "cross_check"
        assert mismatch[0]["year"] == 2023

    def test_consistent_balance_no_mismatch(self, balance_data: list[dict[str, Any]]) -> None:
        anomalies = _detect_balance_anomalies(balance_data, threshold=0.05)
        mismatch = [a for a in anomalies if a["type"] == "balance_mismatch"]
        assert len(mismatch) == 0


# ---------------------------------------------------------------------------
# Negative value detection
# ---------------------------------------------------------------------------

class TestNegativeValues:
    """Negative emissions should be flagged as critical."""

    def test_negative_value_detected(self, balance_data_negative: list[dict[str, Any]]) -> None:
        anomalies = _detect_balance_anomalies(balance_data_negative, threshold=0.05)
        negatives = [a for a in anomalies if a["type"] == "negative_value"]
        assert len(negatives) >= 1

    def test_negative_value_severity_is_critical(self, balance_data_negative: list[dict[str, Any]]) -> None:
        anomalies = _detect_balance_anomalies(balance_data_negative, threshold=0.05)
        negatives = [a for a in anomalies if a["type"] == "negative_value"]
        for neg in negatives:
            assert neg["severity"] == "critical"
            assert neg["severity_score"] == 1.0

    def test_negative_value_description_mentions_field(self, balance_data_negative: list[dict[str, Any]]) -> None:
        anomalies = _detect_balance_anomalies(balance_data_negative, threshold=0.05)
        negatives = [a for a in anomalies if a["type"] == "negative_value"]
        assert any("directEmissions" in n["description"] for n in negatives)


# ---------------------------------------------------------------------------
# Sudden year-over-year change detection (>50%)
# ---------------------------------------------------------------------------

class TestSuddenChange:
    """Year-over-year changes exceeding 50% should be flagged."""

    def test_large_jump_detected(self) -> None:
        emission_data = [
            {"reportingYear": 2023, "totalCo2Emissions": 100.0},
            {"reportingYear": 2024, "totalCo2Emissions": 200.0},  # 100% increase
        ]
        anomalies = _cross_validate(emission_data, [])
        sudden = [a for a in anomalies if a["type"] == "sudden_change"]
        assert len(sudden) == 1
        assert sudden[0]["year"] == 2024
        assert sudden[0]["values"]["change_pct"] == pytest.approx(100.0, abs=0.1)

    def test_large_drop_detected(self) -> None:
        emission_data = [
            {"reportingYear": 2023, "totalCo2Emissions": 200.0},
            {"reportingYear": 2024, "totalCo2Emissions": 50.0},  # 75% decrease
        ]
        anomalies = _cross_validate(emission_data, [])
        sudden = [a for a in anomalies if a["type"] == "sudden_change"]
        assert len(sudden) == 1
        assert sudden[0]["values"]["change_pct"] == pytest.approx(75.0, abs=0.1)

    def test_moderate_change_not_flagged(self) -> None:
        emission_data = [
            {"reportingYear": 2023, "totalCo2Emissions": 100.0},
            {"reportingYear": 2024, "totalCo2Emissions": 130.0},  # 30% increase
        ]
        anomalies = _cross_validate(emission_data, [])
        sudden = [a for a in anomalies if a["type"] == "sudden_change"]
        assert len(sudden) == 0

    def test_single_year_no_cross_validate(self) -> None:
        emission_data = [
            {"reportingYear": 2024, "totalCo2Emissions": 100.0},
        ]
        anomalies = _cross_validate(emission_data, [])
        assert len(anomalies) == 0


# ---------------------------------------------------------------------------
# Quality score
# ---------------------------------------------------------------------------

class TestQualityScore:
    """Tests for _calculate_quality_score."""

    def test_no_anomalies_gives_100(self) -> None:
        assert _calculate_quality_score([], total_records=10) == 100.0

    def test_zero_records_gives_100(self) -> None:
        assert _calculate_quality_score([], total_records=0) == 100.0

    def test_critical_penalises_15(self) -> None:
        anomalies = [{"severity": "critical"}]
        score = _calculate_quality_score(anomalies, total_records=10)
        assert score == 85.0

    def test_warning_penalises_5(self) -> None:
        anomalies = [{"severity": "warning"}]
        score = _calculate_quality_score(anomalies, total_records=10)
        assert score == 95.0

    def test_info_penalises_1(self) -> None:
        anomalies = [{"severity": "info"}]
        score = _calculate_quality_score(anomalies, total_records=10)
        assert score == 99.0

    def test_score_does_not_go_below_zero(self) -> None:
        anomalies = [{"severity": "critical"}] * 10  # 10 * 15 = 150
        score = _calculate_quality_score(anomalies, total_records=5)
        assert score == 0.0

    def test_mixed_severities(self) -> None:
        anomalies = [
            {"severity": "critical"},
            {"severity": "warning"},
            {"severity": "info"},
        ]
        # 15 + 5 + 1 = 21 => 100 - 21 = 79
        score = _calculate_quality_score(anomalies, total_records=20)
        assert score == 79.0


# ---------------------------------------------------------------------------
# _safe_float
# ---------------------------------------------------------------------------

class TestSafeFloat:
    """Tests for the _safe_float helper."""

    def test_none_returns_none(self) -> None:
        assert _safe_float(None) is None

    def test_valid_float(self) -> None:
        assert _safe_float(3.14) == 3.14

    def test_valid_int(self) -> None:
        assert _safe_float(42) == 42.0

    def test_valid_string(self) -> None:
        assert _safe_float("99.5") == 99.5

    def test_invalid_string_returns_none(self) -> None:
        assert _safe_float("not-a-number") is None

    def test_empty_string_returns_none(self) -> None:
        assert _safe_float("") is None

    def test_negative_value(self) -> None:
        assert _safe_float(-10.5) == -10.5

    def test_zero(self) -> None:
        assert _safe_float(0) == 0.0


# ---------------------------------------------------------------------------
# _score_to_severity
# ---------------------------------------------------------------------------

class TestScoreToSeverity:
    """Tests for the severity classification thresholds."""

    def test_high_score_is_critical(self) -> None:
        assert _score_to_severity(0.7) == "critical"
        assert _score_to_severity(0.9) == "critical"
        assert _score_to_severity(1.0) == "critical"

    def test_mid_score_is_warning(self) -> None:
        assert _score_to_severity(0.4) == "warning"
        assert _score_to_severity(0.5) == "warning"
        assert _score_to_severity(0.69) == "warning"

    def test_low_score_is_info(self) -> None:
        assert _score_to_severity(0.0) == "info"
        assert _score_to_severity(0.1) == "info"
        assert _score_to_severity(0.39) == "info"
