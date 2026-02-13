import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://ecosfer:ecosfer_dev_2026@localhost:5432/ecosfer_skdm")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# AI model settings
FORECAST_MIN_DATAPOINTS = 3
ANOMALY_CONTAMINATION = 0.05
NARRATIVE_MAX_TOKENS = 2000
NARRATIVE_DEFAULT_LANGUAGE = "tr"
