"""
Anomaly Detection Service
Uses IsolationForest for detecting outliers in emission data with severity scores.
"""

import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from config import ANOMALY_CONTAMINATION


def detect_anomalies(
    emission_data: list[dict],
    balance_data: list[dict],
    threshold: float = ANOMALY_CONTAMINATION,
) -> dict:
    """
    Detect anomalies in emission and balance data.

    Args:
        emission_data: List of emission records
        balance_data: List of GHG balance records
        threshold: Contamination rate (expected proportion of outliers)

    Returns:
        Dictionary with detected anomalies and summary statistics
    """
    if not emission_data and not balance_data:
        return {
            "status": "no_data",
            "message": "Anomali tespiti icin veri bulunamadi",
            "anomalies": [],
            "summary": None,
        }

    anomalies = []

    # Detect anomalies in emissions
    if emission_data:
        emission_anomalies = _detect_emission_anomalies(emission_data, threshold)
        anomalies.extend(emission_anomalies)

    # Detect anomalies in balance data
    if balance_data:
        balance_anomalies = _detect_balance_anomalies(balance_data, threshold)
        anomalies.extend(balance_anomalies)

    # Cross-validation checks
    cross_anomalies = _cross_validate(emission_data, balance_data)
    anomalies.extend(cross_anomalies)

    # Sort by severity (highest first)
    anomalies.sort(key=lambda x: x["severity_score"], reverse=True)

    # Summary
    summary = {
        "total_anomalies": len(anomalies),
        "critical": len([a for a in anomalies if a["severity"] == "critical"]),
        "warning": len([a for a in anomalies if a["severity"] == "warning"]),
        "info": len([a for a in anomalies if a["severity"] == "info"]),
        "data_quality_score": _calculate_quality_score(anomalies, len(emission_data) + len(balance_data)),
    }

    return {
        "status": "success",
        "message": f"{len(anomalies)} anomali tespit edildi",
        "anomalies": anomalies,
        "summary": summary,
    }


def _detect_emission_anomalies(data: list[dict], threshold: float) -> list[dict]:
    """Detect anomalies in emission values using IsolationForest."""
    # Extract numeric features
    features = []
    valid_rows = []
    for row in data:
        values = []
        for field in ["aDValue", "eFValue", "directEmissions", "indirectEmissions", "totalCo2Emissions"]:
            val = row.get(field)
            values.append(float(val) if val is not None else 0.0)
        if any(v != 0 for v in values):
            features.append(values)
            valid_rows.append(row)

    if len(features) < 5:
        return []

    X = np.array(features)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = IsolationForest(
        contamination=min(threshold, 0.5),
        random_state=42,
        n_estimators=100,
    )
    predictions = model.fit_predict(X_scaled)
    scores = model.decision_function(X_scaled)

    anomalies = []
    for i, (pred, score) in enumerate(zip(predictions, scores)):
        if pred == -1:  # Anomaly
            row = valid_rows[i]
            severity_score = float(abs(score))
            severity = _score_to_severity(severity_score)

            anomalies.append({
                "type": "emission_outlier",
                "source": "IsolationForest",
                "record_id": row.get("id", ""),
                "year": row.get("reportingYear"),
                "emission_type": row.get("emission_type", ""),
                "severity": severity,
                "severity_score": round(severity_score, 4),
                "description": _describe_emission_anomaly(row, severity),
                "values": {
                    "directEmissions": _safe_float(row.get("directEmissions")),
                    "indirectEmissions": _safe_float(row.get("indirectEmissions")),
                    "totalCo2Emissions": _safe_float(row.get("totalCo2Emissions")),
                },
            })

    return anomalies


def _detect_balance_anomalies(data: list[dict], threshold: float) -> list[dict]:
    """Detect anomalies in GHG balance data."""
    anomalies = []

    for row in data:
        direct = _safe_float(row.get("directEmissions"))
        indirect = _safe_float(row.get("indirectEmissions"))
        total = _safe_float(row.get("totalEmissions"))
        year = row.get("reportingYear")

        # Check: total should approximately equal direct + indirect
        if direct and indirect and total:
            expected = direct + indirect
            diff = abs(total - expected)
            if expected > 0 and diff / expected > 0.1:  # >10% discrepancy
                severity_score = min(diff / expected, 1.0)
                anomalies.append({
                    "type": "balance_mismatch",
                    "source": "cross_check",
                    "record_id": row.get("id", ""),
                    "year": year,
                    "emission_type": "",
                    "severity": _score_to_severity(severity_score),
                    "severity_score": round(severity_score, 4),
                    "description": f"Yil {year}: Toplam emisyon ({total:.2f}) dogrudan ({direct:.2f}) + dolayli ({indirect:.2f}) toplamina uymuyor. Fark: {diff:.2f} tCO2e",
                    "values": {
                        "directEmissions": direct,
                        "indirectEmissions": indirect,
                        "totalEmissions": total,
                        "expected": round(expected, 4),
                    },
                })

        # Check: negative values
        for field_name, value in [("directEmissions", direct), ("indirectEmissions", indirect), ("totalEmissions", total)]:
            if value is not None and value < 0:
                anomalies.append({
                    "type": "negative_value",
                    "source": "validation",
                    "record_id": row.get("id", ""),
                    "year": year,
                    "emission_type": "",
                    "severity": "critical",
                    "severity_score": 1.0,
                    "description": f"Yil {year}: {field_name} negatif deger ({value:.4f}). Bu fiziksel olarak mumkun degildir.",
                    "values": {field_name: value},
                })

    return anomalies


def _cross_validate(emission_data: list[dict], balance_data: list[dict]) -> list[dict]:
    """Cross-validate between emission and balance records."""
    anomalies = []

    # Check for sudden year-over-year changes in emissions
    if len(emission_data) >= 2:
        yearly_totals: dict[int, float] = {}
        for row in emission_data:
            year = row.get("reportingYear")
            total = _safe_float(row.get("totalCo2Emissions"))
            if year and total:
                yearly_totals[int(year)] = yearly_totals.get(int(year), 0) + total

        sorted_years = sorted(yearly_totals.items())
        for i in range(1, len(sorted_years)):
            prev_year, prev_val = sorted_years[i - 1]
            curr_year, curr_val = sorted_years[i]
            if prev_val > 0:
                change_pct = abs(curr_val - prev_val) / prev_val * 100
                if change_pct > 50:  # >50% year-over-year change
                    severity_score = min(change_pct / 100, 1.0)
                    direction = "artis" if curr_val > prev_val else "azalis"
                    anomalies.append({
                        "type": "sudden_change",
                        "source": "trend_analysis",
                        "record_id": "",
                        "year": curr_year,
                        "emission_type": "",
                        "severity": _score_to_severity(severity_score * 0.7),
                        "severity_score": round(severity_score * 0.7, 4),
                        "description": f"{prev_year}-{curr_year}: Yillik emisyonda %{change_pct:.1f} {direction} ({prev_val:.2f} -> {curr_val:.2f} tCO2e). Ani degisim incelenmelidir.",
                        "values": {
                            "previous_year": prev_year,
                            "previous_emissions": round(prev_val, 4),
                            "current_year": curr_year,
                            "current_emissions": round(curr_val, 4),
                            "change_pct": round(change_pct, 2),
                        },
                    })

    return anomalies


def _safe_float(val) -> float | None:
    if val is None:
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def _score_to_severity(score: float) -> str:
    if score >= 0.7:
        return "critical"
    elif score >= 0.4:
        return "warning"
    return "info"


def _describe_emission_anomaly(row: dict, severity: str) -> str:
    year = row.get("reportingYear", "?")
    etype = row.get("emission_type", "Bilinmeyen")
    total = _safe_float(row.get("totalCo2Emissions"))
    total_str = f"{total:.4f} tCO2e" if total else "N/A"

    if severity == "critical":
        return f"Yil {year}, {etype}: Kritik anomali tespit edildi. Toplam emisyon: {total_str}. Veri dogrulamasi gereklidir."
    elif severity == "warning":
        return f"Yil {year}, {etype}: Uyari seviyesinde sapma. Toplam emisyon: {total_str}. Incelenmesi onerilir."
    return f"Yil {year}, {etype}: Hafif sapma. Toplam emisyon: {total_str}."


def _calculate_quality_score(anomalies: list[dict], total_records: int) -> float:
    """Calculate data quality score (0-100)."""
    if total_records == 0:
        return 100.0

    penalty = 0
    for a in anomalies:
        if a["severity"] == "critical":
            penalty += 15
        elif a["severity"] == "warning":
            penalty += 5
        else:
            penalty += 1

    score = max(0, 100 - penalty)
    return round(score, 1)
