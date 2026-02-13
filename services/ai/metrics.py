import time
from functools import wraps
from prometheus_client import Counter, Histogram, Gauge, Info, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Response

# Service info
SERVICE_INFO = Info("ai_service", "AI Service information")
SERVICE_INFO.info({"version": "2.0.0", "service": "ecosfer-ai"})

# Request metrics
REQUEST_COUNT = Counter(
    "ai_requests_total",
    "Total AI service requests",
    ["endpoint", "status"]
)

REQUEST_DURATION = Histogram(
    "ai_request_duration_seconds",
    "AI request duration in seconds",
    ["endpoint"],
    buckets=[0.1, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0, 120.0]
)

ACTIVE_REQUESTS = Gauge(
    "ai_active_requests",
    "Number of active AI requests",
    ["endpoint"]
)

# Forecast metrics
FORECAST_MODEL_USED = Counter(
    "ai_forecast_model_total",
    "Forecast model usage count",
    ["model"]
)

FORECAST_R2_SCORE = Histogram(
    "ai_forecast_r2_score",
    "Distribution of forecast R2 scores",
    buckets=[0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
)

# Anomaly detection metrics
ANOMALIES_DETECTED = Counter(
    "ai_anomalies_detected_total",
    "Total anomalies detected",
    ["severity"]
)

DATA_QUALITY_SCORE = Histogram(
    "ai_data_quality_score",
    "Distribution of data quality scores",
    buckets=[0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
)

# Narrative metrics
NARRATIVE_MODEL_USED = Counter(
    "ai_narrative_model_total",
    "Narrative generation model usage",
    ["model", "language"]
)

NARRATIVE_LENGTH = Histogram(
    "ai_narrative_length_chars",
    "Length of generated narratives in characters",
    buckets=[100, 500, 1000, 2000, 5000, 10000]
)

# DB query metrics
DB_QUERY_DURATION = Histogram(
    "ai_db_query_duration_seconds",
    "Database query duration",
    ["query_type"],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5]
)


def track_request(endpoint: str):
    """Decorator to track request metrics."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            ACTIVE_REQUESTS.labels(endpoint=endpoint).inc()
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                REQUEST_COUNT.labels(endpoint=endpoint, status="success").inc()
                return result
            except Exception as e:
                REQUEST_COUNT.labels(endpoint=endpoint, status="error").inc()
                raise
            finally:
                duration = time.time() - start_time
                REQUEST_DURATION.labels(endpoint=endpoint).observe(duration)
                ACTIVE_REQUESTS.labels(endpoint=endpoint).dec()
        return wrapper
    return decorator


async def metrics_endpoint():
    """Prometheus metrics endpoint."""
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )
