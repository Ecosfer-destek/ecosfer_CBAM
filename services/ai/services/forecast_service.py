"""
Emission Forecast Service
Uses scikit-learn/XGBoost for trend prediction with confidence intervals.
"""

import numpy as np
from datetime import datetime
from config import FORECAST_MIN_DATAPOINTS


def forecast_emissions(emission_data: list[dict], periods: int = 12) -> dict:
    """
    Forecast future emissions based on historical data.

    Args:
        emission_data: List of emission records with reportingYear and totalCo2Emissions
        periods: Number of future periods (months) to forecast

    Returns:
        Dictionary with forecast data, trend info, and confidence intervals
    """
    if not emission_data:
        return {
            "status": "no_data",
            "message": "Tahmin icin yeterli veri bulunamadi",
            "forecast": [],
            "trend": None,
            "confidence": None,
        }

    # Aggregate emissions by year
    yearly_data = _aggregate_by_year(emission_data)

    if len(yearly_data) < FORECAST_MIN_DATAPOINTS:
        return {
            "status": "insufficient_data",
            "message": f"En az {FORECAST_MIN_DATAPOINTS} yillik veri gerekli (mevcut: {len(yearly_data)})",
            "forecast": [],
            "historical": [{"year": y, "emissions": e} for y, e in yearly_data],
            "trend": None,
            "confidence": None,
        }

    years = np.array([y for y, _ in yearly_data])
    emissions = np.array([e for _, e in yearly_data])

    # Try XGBoost first, fallback to linear regression
    try:
        forecast_result = _xgboost_forecast(years, emissions, periods)
    except Exception:
        forecast_result = _linear_forecast(years, emissions, periods)

    # Calculate trend
    trend = _calculate_trend(years, emissions)

    return {
        "status": "success",
        "message": "Tahmin basariyla olusturuldu",
        "historical": [{"year": int(y), "emissions": float(e)} for y, e in yearly_data],
        "forecast": forecast_result["predictions"],
        "trend": trend,
        "confidence": forecast_result["confidence"],
        "model": forecast_result["model"],
        "r2_score": forecast_result.get("r2_score"),
    }


def _aggregate_by_year(data: list[dict]) -> list[tuple]:
    """Aggregate emissions by reporting year."""
    year_totals: dict[int, float] = {}
    for row in data:
        year = row.get("reportingYear")
        total = row.get("totalCo2Emissions") or row.get("directEmissions") or 0
        if year and total:
            try:
                year_val = int(year)
                total_val = float(total)
                year_totals[year_val] = year_totals.get(year_val, 0) + total_val
            except (ValueError, TypeError):
                continue
    return sorted(year_totals.items())


def _xgboost_forecast(years: np.ndarray, emissions: np.ndarray, periods: int) -> dict:
    """XGBoost-based forecast with confidence via bootstrapping."""
    from xgboost import XGBRegressor

    X = years.reshape(-1, 1)
    y = emissions

    model = XGBRegressor(
        n_estimators=100,
        max_depth=3,
        learning_rate=0.1,
        random_state=42,
    )
    model.fit(X, y)

    # Generate future years
    last_year = int(years[-1])
    future_years = np.arange(last_year + 1, last_year + 1 + periods).reshape(-1, 1)
    predictions = model.predict(future_years)

    # Bootstrap confidence intervals
    n_bootstrap = 50
    bootstrap_preds = []
    for _ in range(n_bootstrap):
        indices = np.random.choice(len(X), size=len(X), replace=True)
        X_boot, y_boot = X[indices], y[indices]
        boot_model = XGBRegressor(n_estimators=50, max_depth=3, learning_rate=0.1, random_state=None)
        boot_model.fit(X_boot, y_boot)
        bootstrap_preds.append(boot_model.predict(future_years))

    bootstrap_preds = np.array(bootstrap_preds)
    lower = np.percentile(bootstrap_preds, 5, axis=0)
    upper = np.percentile(bootstrap_preds, 95, axis=0)

    # R2 score on training data
    from sklearn.metrics import r2_score
    train_pred = model.predict(X)
    r2 = r2_score(y, train_pred)

    return {
        "model": "XGBoost",
        "predictions": [
            {
                "year": int(future_years[i][0]),
                "predicted": float(max(0, predictions[i])),
                "lower_bound": float(max(0, lower[i])),
                "upper_bound": float(max(0, upper[i])),
            }
            for i in range(len(predictions))
        ],
        "confidence": {"level": 0.90, "method": "bootstrap"},
        "r2_score": float(r2),
    }


def _linear_forecast(years: np.ndarray, emissions: np.ndarray, periods: int) -> dict:
    """Simple linear regression fallback."""
    from sklearn.linear_model import LinearRegression
    from sklearn.metrics import r2_score

    X = years.reshape(-1, 1)
    model = LinearRegression()
    model.fit(X, emissions)

    last_year = int(years[-1])
    future_years = np.arange(last_year + 1, last_year + 1 + periods).reshape(-1, 1)
    predictions = model.predict(future_years)

    # Simple confidence based on residual std
    train_pred = model.predict(X)
    residual_std = np.std(emissions - train_pred)
    r2 = r2_score(emissions, train_pred)

    return {
        "model": "LinearRegression",
        "predictions": [
            {
                "year": int(future_years[i][0]),
                "predicted": float(max(0, predictions[i])),
                "lower_bound": float(max(0, predictions[i] - 1.645 * residual_std)),
                "upper_bound": float(predictions[i] + 1.645 * residual_std),
            }
            for i in range(len(predictions))
        ],
        "confidence": {"level": 0.90, "method": "residual_std"},
        "r2_score": float(r2),
    }


def _calculate_trend(years: np.ndarray, emissions: np.ndarray) -> dict:
    """Calculate emission trend statistics."""
    if len(emissions) < 2:
        return {"direction": "unknown", "change_pct": 0, "avg_annual_change": 0}

    # Linear trend slope
    coeffs = np.polyfit(years, emissions, 1)
    slope = coeffs[0]

    # Percentage change
    first_val = emissions[0]
    last_val = emissions[-1]
    change_pct = ((last_val - first_val) / first_val * 100) if first_val != 0 else 0

    # Average annual change
    n_years = years[-1] - years[0]
    avg_change = (last_val - first_val) / n_years if n_years > 0 else 0

    direction = "increasing" if slope > 0 else "decreasing" if slope < 0 else "stable"

    return {
        "direction": direction,
        "change_pct": round(float(change_pct), 2),
        "avg_annual_change": round(float(avg_change), 4),
        "slope": round(float(slope), 4),
    }
