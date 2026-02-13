from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
import os
import structlog
import logging

from database import get_db, fetch_emission_data, fetch_installation_summary, fetch_balance_data
from services.forecast_service import forecast_emissions
from services.anomaly_service import detect_anomalies
from services.narrative_service import generate_narrative
from metrics import (
    metrics_endpoint, track_request,
    FORECAST_MODEL_USED, FORECAST_R2_SCORE,
    ANOMALIES_DETECTED, DATA_QUALITY_SCORE,
    NARRATIVE_MODEL_USED, NARRATIVE_LENGTH,
)

# Configure structured logging
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer() if __name__ == "__main__" else structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
)

logger = structlog.get_logger(service="ecosfer-ai")

app = FastAPI(
    title="Ecosfer SKDM AI Service",
    description="AI/ML endpoints for emission forecasting, anomaly detection, and report generation",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus metrics endpoint
app.add_api_route("/metrics", metrics_endpoint, methods=["GET"], include_in_schema=False)


# =============================================================================
# Health Check
# =============================================================================

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: datetime


_start_time = datetime.utcnow()


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        service="ecosfer-ai",
        version="2.0.0",
        timestamp=datetime.utcnow(),
    )


# =============================================================================
# Emission Forecast
# =============================================================================

class ForecastRequest(BaseModel):
    installation_id: str
    periods: int = Field(default=6, ge=1, le=24, description="Number of future periods to forecast")


class ForecastPrediction(BaseModel):
    year: int
    predicted: float
    lower_bound: float
    upper_bound: float


class TrendInfo(BaseModel):
    direction: str
    change_pct: float
    avg_annual_change: float
    slope: Optional[float] = None


class ConfidenceInfo(BaseModel):
    level: float
    method: str


class HistoricalPoint(BaseModel):
    year: int
    emissions: float


class ForecastResponse(BaseModel):
    status: str
    message: str
    historical: list[HistoricalPoint] = []
    forecast: list[ForecastPrediction] = []
    trend: Optional[TrendInfo] = None
    confidence: Optional[ConfidenceInfo] = None
    model: Optional[str] = None
    r2_score: Optional[float] = None


@app.post("/api/v1/forecast/emissions", response_model=ForecastResponse)
@track_request("forecast")
async def api_forecast_emissions(
    request: ForecastRequest,
    x_tenant_id: str = Header(..., alias="X-Tenant-Id"),
    db=Depends(get_db),
):
    logger.info("forecast_request", installation_id=request.installation_id, periods=request.periods)
    emission_data = fetch_emission_data(db, request.installation_id, x_tenant_id)
    result = forecast_emissions(emission_data, request.periods)

    if result.get("model"):
        FORECAST_MODEL_USED.labels(model=result["model"]).inc()
    if result.get("r2_score") is not None:
        FORECAST_R2_SCORE.observe(max(0, result["r2_score"]))

    return ForecastResponse(**result)


# =============================================================================
# Anomaly Detection
# =============================================================================

class AnomalyRequest(BaseModel):
    installation_id: str
    threshold: float = Field(default=0.05, ge=0.01, le=0.5, description="Contamination rate")


class AnomalyItem(BaseModel):
    type: str
    source: str
    record_id: str
    year: Optional[int] = None
    emission_type: str
    severity: str
    severity_score: float
    description: str
    values: dict = {}


class AnomalySummary(BaseModel):
    total_anomalies: int
    critical: int
    warning: int
    info: int
    data_quality_score: float


class AnomalyResponse(BaseModel):
    status: str
    message: str
    anomalies: list[AnomalyItem] = []
    summary: Optional[AnomalySummary] = None


@app.post("/api/v1/analysis/anomalies", response_model=AnomalyResponse)
@track_request("anomalies")
async def api_detect_anomalies(
    request: AnomalyRequest,
    x_tenant_id: str = Header(..., alias="X-Tenant-Id"),
    db=Depends(get_db),
):
    logger.info("anomaly_request", installation_id=request.installation_id, threshold=request.threshold)
    emission_data = fetch_emission_data(db, request.installation_id, x_tenant_id)
    balance_data = fetch_balance_data(db, request.installation_id, x_tenant_id)
    result = detect_anomalies(emission_data, balance_data, request.threshold)

    if result.get("summary"):
        summary = result["summary"]
        for severity in ["critical", "warning", "info"]:
            count = summary.get(severity, 0)
            if count > 0:
                ANOMALIES_DETECTED.labels(severity=severity).inc(count)
        if summary.get("data_quality_score") is not None:
            DATA_QUALITY_SCORE.observe(summary["data_quality_score"])

    return AnomalyResponse(**result)


# =============================================================================
# Report Narrative
# =============================================================================

class NarrativeRequest(BaseModel):
    installation_id: str
    report_type: str = Field(default="summary", description="summary, detailed, or executive")
    language: str = Field(default="tr", description="tr, en, or de")


class NarrativeResponse(BaseModel):
    status: str
    message: str
    narrative: str = ""
    language: str = "tr"
    report_type: str = "summary"
    model: Optional[str] = None


@app.post("/api/v1/analysis/report-narrative", response_model=NarrativeResponse)
@track_request("narrative")
async def api_generate_narrative(
    request: NarrativeRequest,
    x_tenant_id: str = Header(..., alias="X-Tenant-Id"),
    db=Depends(get_db),
):
    logger.info("narrative_request", installation_id=request.installation_id, language=request.language, report_type=request.report_type)
    installation_info = fetch_installation_summary(db, request.installation_id, x_tenant_id)
    emission_data = fetch_emission_data(db, request.installation_id, x_tenant_id)
    balance_data = fetch_balance_data(db, request.installation_id, x_tenant_id)

    result = generate_narrative(
        installation_info=installation_info,
        emission_data=emission_data,
        balance_data=balance_data,
        report_type=request.report_type,
        language=request.language,
    )

    if result.get("model"):
        NARRATIVE_MODEL_USED.labels(model=result["model"], language=request.language).inc()
    if result.get("narrative"):
        NARRATIVE_LENGTH.observe(len(result["narrative"]))

    return NarrativeResponse(**result)
