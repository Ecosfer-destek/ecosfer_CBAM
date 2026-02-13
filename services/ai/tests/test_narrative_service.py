"""Tests for services/narrative_service.py."""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any
from unittest.mock import patch

import pytest

_SERVICE_ROOT = str(Path(__file__).resolve().parent.parent)
if _SERVICE_ROOT not in sys.path:
    sys.path.insert(0, _SERVICE_ROOT)

from services.narrative_service import (
    _generate_template,
    _prepare_context,
    generate_narrative,
)


# ---------------------------------------------------------------------------
# generate_narrative - top-level function
# ---------------------------------------------------------------------------

class TestGenerateNarrative:
    """Tests for the main generate_narrative entry point."""

    def test_no_data_returns_no_data_status(self) -> None:
        result = generate_narrative(
            installation_info=None,
            emission_data=[],
            balance_data=[],
            report_type="summary",
            language="tr",
        )
        assert result["status"] == "no_data"
        assert result["narrative"] == ""
        assert result["language"] == "tr"
        assert result["report_type"] == "summary"

    @patch("services.narrative_service.ANTHROPIC_API_KEY", "")
    @patch("services.narrative_service.OPENAI_API_KEY", "")
    def test_template_fallback_when_no_api_keys(
        self,
        emission_data: list[dict[str, Any]],
        installation_info: dict[str, Any],
    ) -> None:
        result = generate_narrative(
            installation_info=installation_info,
            emission_data=emission_data,
            balance_data=[],
            report_type="summary",
            language="tr",
        )
        assert result["status"] == "success"
        assert result["model"] == "template"
        assert len(result["narrative"]) > 0

    @patch("services.narrative_service.ANTHROPIC_API_KEY", "")
    @patch("services.narrative_service.OPENAI_API_KEY", "")
    def test_template_fallback_message_mentions_api_key(
        self,
        emission_data: list[dict[str, Any]],
        installation_info: dict[str, Any],
    ) -> None:
        result = generate_narrative(
            installation_info=installation_info,
            emission_data=emission_data,
            balance_data=[],
            report_type="summary",
            language="en",
        )
        assert "sablon" in result["message"].lower() or "API" in result["message"]

    @patch("services.narrative_service.ANTHROPIC_API_KEY", "")
    @patch("services.narrative_service.OPENAI_API_KEY", "")
    def test_language_is_preserved(
        self,
        emission_data: list[dict[str, Any]],
        installation_info: dict[str, Any],
    ) -> None:
        for lang in ("tr", "en", "de"):
            result = generate_narrative(
                installation_info=installation_info,
                emission_data=emission_data,
                balance_data=[],
                report_type="summary",
                language=lang,
            )
            assert result["language"] == lang

    @patch("services.narrative_service.ANTHROPIC_API_KEY", "")
    @patch("services.narrative_service.OPENAI_API_KEY", "")
    def test_report_type_is_preserved(
        self,
        emission_data: list[dict[str, Any]],
        installation_info: dict[str, Any],
    ) -> None:
        for rtype in ("summary", "detailed", "executive"):
            result = generate_narrative(
                installation_info=installation_info,
                emission_data=emission_data,
                balance_data=[],
                report_type=rtype,
                language="tr",
            )
            assert result["report_type"] == rtype


# ---------------------------------------------------------------------------
# _prepare_context
# ---------------------------------------------------------------------------

class TestPrepareContext:
    """Tests for context data aggregation."""

    def test_has_data_true_with_emissions(
        self,
        emission_data: list[dict[str, Any]],
        installation_info: dict[str, Any],
    ) -> None:
        ctx = _prepare_context(installation_info, emission_data, [])
        assert ctx["has_data"] is True

    def test_has_data_false_with_empty(self) -> None:
        ctx = _prepare_context(None, [], [])
        assert ctx["has_data"] is False

    def test_yearly_aggregation(self, emission_data: list[dict[str, Any]]) -> None:
        ctx = _prepare_context(None, emission_data, [])
        yearly = ctx["yearly_emissions"]
        assert len(yearly) == 5
        assert 2020 in yearly
        assert 2024 in yearly

    def test_yearly_direct_and_indirect(self, emission_data: list[dict[str, Any]]) -> None:
        ctx = _prepare_context(None, emission_data, [])
        y2020 = ctx["yearly_emissions"][2020]
        assert y2020["direct"] == pytest.approx(80.0)
        assert y2020["indirect"] == pytest.approx(20.0)
        assert y2020["total"] == pytest.approx(100.5)
        assert y2020["count"] == 1

    def test_years_sorted(self, emission_data: list[dict[str, Any]]) -> None:
        ctx = _prepare_context(None, emission_data, [])
        assert ctx["years"] == sorted(ctx["years"])

    def test_total_records(self, emission_data: list[dict[str, Any]]) -> None:
        ctx = _prepare_context(None, emission_data, [])
        assert ctx["total_records"] == 5

    def test_trend_increasing(self, emission_data: list[dict[str, Any]]) -> None:
        ctx = _prepare_context(None, emission_data, [])
        trend = ctx["trend"]
        assert trend is not None
        assert trend["direction"] == "increasing"
        assert trend["change_pct"] > 0
        assert trend["first_year"] == 2020
        assert trend["last_year"] == 2024

    def test_trend_decreasing(self) -> None:
        data = [
            {"reportingYear": 2020, "totalCo2Emissions": 200.0, "directEmissions": 150.0, "indirectEmissions": 50.0},
            {"reportingYear": 2024, "totalCo2Emissions": 100.0, "directEmissions": 80.0, "indirectEmissions": 20.0},
        ]
        ctx = _prepare_context(None, data, [])
        assert ctx["trend"]["direction"] == "decreasing"

    def test_trend_stable(self) -> None:
        data = [
            {"reportingYear": 2020, "totalCo2Emissions": 100.0, "directEmissions": 80.0, "indirectEmissions": 20.0},
            {"reportingYear": 2024, "totalCo2Emissions": 102.0, "directEmissions": 81.0, "indirectEmissions": 21.0},
        ]
        ctx = _prepare_context(None, data, [])
        assert ctx["trend"]["direction"] == "stable"

    def test_trend_none_for_single_year(self) -> None:
        data = [
            {"reportingYear": 2024, "totalCo2Emissions": 100.0, "directEmissions": 80.0, "indirectEmissions": 20.0},
        ]
        ctx = _prepare_context(None, data, [])
        assert ctx["trend"] is None

    def test_installation_info_preserved(self, installation_info: dict[str, Any]) -> None:
        ctx = _prepare_context(installation_info, [], [])
        assert ctx["installation"]["installation_name"] == "Test Tesis"
        assert ctx["installation"]["company_name"] == "Ecosfer A.S."

    def test_balance_summary(self, balance_data: list[dict[str, Any]]) -> None:
        ctx = _prepare_context(None, [], balance_data)
        assert len(ctx["balance_summary"]) == 5
        first = ctx["balance_summary"][0]
        assert "year" in first
        assert "direct" in first
        assert "indirect" in first
        assert "total" in first

    def test_multiple_records_same_year_aggregated(self) -> None:
        data = [
            {"reportingYear": 2023, "totalCo2Emissions": 50.0, "directEmissions": 30.0, "indirectEmissions": 20.0},
            {"reportingYear": 2023, "totalCo2Emissions": 70.0, "directEmissions": 50.0, "indirectEmissions": 20.0},
        ]
        ctx = _prepare_context(None, data, [])
        y2023 = ctx["yearly_emissions"][2023]
        assert y2023["total"] == pytest.approx(120.0)
        assert y2023["direct"] == pytest.approx(80.0)
        assert y2023["count"] == 2


# ---------------------------------------------------------------------------
# Template generation (TR / EN / DE)
# ---------------------------------------------------------------------------

class TestTemplateGeneration:
    """Tests for the template-based fallback narrative."""

    def _make_context(
        self,
        emission_data: list[dict[str, Any]],
        installation_info: dict[str, Any],
    ) -> dict:
        return _prepare_context(installation_info, emission_data, [])

    def test_tr_template_has_turkish_headers(
        self,
        emission_data: list[dict[str, Any]],
        installation_info: dict[str, Any],
    ) -> None:
        ctx = self._make_context(emission_data, installation_info)
        narrative = _generate_template(ctx, "summary", "tr")
        assert "Genel Degerlendirme" in narrative
        assert "Emisyon Trendleri" in narrative
        assert "Onemli Bulgular" in narrative
        assert "Oneriler" in narrative

    def test_en_template_has_english_headers(
        self,
        emission_data: list[dict[str, Any]],
        installation_info: dict[str, Any],
    ) -> None:
        ctx = self._make_context(emission_data, installation_info)
        narrative = _generate_template(ctx, "summary", "en")
        assert "General Assessment" in narrative
        assert "Emission Trends" in narrative
        assert "Key Findings" in narrative
        assert "Recommendations" in narrative

    def test_de_template_has_german_headers(
        self,
        emission_data: list[dict[str, Any]],
        installation_info: dict[str, Any],
    ) -> None:
        ctx = self._make_context(emission_data, installation_info)
        narrative = _generate_template(ctx, "summary", "de")
        assert "Allgemeine Bewertung" in narrative
        assert "Emissionstrends" in narrative
        assert "Wichtige Erkenntnisse" in narrative
        assert "Empfehlungen" in narrative

    def test_tr_template_contains_table(
        self,
        emission_data: list[dict[str, Any]],
        installation_info: dict[str, Any],
    ) -> None:
        ctx = self._make_context(emission_data, installation_info)
        narrative = _generate_template(ctx, "summary", "tr")
        assert "| Yil" in narrative
        assert "| 2020" in narrative
        assert "| 2024" in narrative

    def test_en_template_contains_table(
        self,
        emission_data: list[dict[str, Any]],
        installation_info: dict[str, Any],
    ) -> None:
        ctx = self._make_context(emission_data, installation_info)
        narrative = _generate_template(ctx, "summary", "en")
        assert "| Year" in narrative

    def test_template_contains_installation_name(
        self,
        emission_data: list[dict[str, Any]],
        installation_info: dict[str, Any],
    ) -> None:
        ctx = self._make_context(emission_data, installation_info)
        narrative = _generate_template(ctx, "summary", "tr")
        assert "Test Tesis" in narrative

    def test_template_contains_company_name(
        self,
        emission_data: list[dict[str, Any]],
        installation_info: dict[str, Any],
    ) -> None:
        ctx = self._make_context(emission_data, installation_info)
        narrative = _generate_template(ctx, "summary", "tr")
        assert "Ecosfer A.S." in narrative

    def test_tr_template_mentions_trend(
        self,
        emission_data: list[dict[str, Any]],
        installation_info: dict[str, Any],
    ) -> None:
        ctx = self._make_context(emission_data, installation_info)
        narrative = _generate_template(ctx, "summary", "tr")
        # The trend is increasing, so Turkish template should contain "artis"
        assert "artis" in narrative.lower() or "degisim" in narrative.lower()

    def test_template_footer(
        self,
        emission_data: list[dict[str, Any]],
        installation_info: dict[str, Any],
    ) -> None:
        ctx = self._make_context(emission_data, installation_info)
        narrative_tr = _generate_template(ctx, "summary", "tr")
        narrative_en = _generate_template(ctx, "summary", "en")
        narrative_de = _generate_template(ctx, "summary", "de")
        assert "Ecosfer SKDM Platform v2.0" in narrative_tr
        assert "Ecosfer SKDM Platform v2.0" in narrative_en
        assert "Ecosfer SKDM Platform v2.0" in narrative_de

    def test_unknown_language_falls_back_to_english(
        self,
        emission_data: list[dict[str, Any]],
        installation_info: dict[str, Any],
    ) -> None:
        ctx = self._make_context(emission_data, installation_info)
        narrative = _generate_template(ctx, "summary", "fr")
        assert "General Assessment" in narrative
