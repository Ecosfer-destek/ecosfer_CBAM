#!/bin/bash
# Post-Deploy Health Check Script
# Verifies all services are running and responding correctly
# Usage: ./scripts/health-check.sh [base_url]

set -euo pipefail

BASE_URL="${1:-http://localhost}"
ERRORS=0

echo "=== Ecosfer SKDM Post-Deploy Health Check ==="
echo "Base URL: $BASE_URL"
echo ""

check_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"

    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 30 "$url" 2>/dev/null || echo "000")

    if [ "$HTTP_STATUS" = "$expected_status" ]; then
        echo "[OK] $name ($url) -> HTTP $HTTP_STATUS"
    else
        echo "[FAIL] $name ($url) -> HTTP $HTTP_STATUS (expected $expected_status)"
        ERRORS=$((ERRORS + 1))
    fi
}

# === Service Health Endpoints ===
echo "--- Service Health ---"
check_endpoint "Nginx" "$BASE_URL/nginx-health"
check_endpoint "Frontend" "$BASE_URL/api/health"
check_endpoint "Frontend (page)" "$BASE_URL/login"
check_endpoint ".NET Service" "http://localhost:5100/health"
check_endpoint "AI Service" "http://localhost:8000/health"

# === API Endpoints ===
echo ""
echo "--- API Endpoints ---"
check_endpoint ".NET Swagger" "http://localhost:5100/swagger/index.html"
check_endpoint "Metrics (Frontend)" "$BASE_URL/api/metrics"
check_endpoint "Metrics (.NET)" "http://localhost:5100/metrics"
check_endpoint "Metrics (AI)" "http://localhost:8000/metrics"

# === Monitoring Stack ===
echo ""
echo "--- Monitoring ---"
check_endpoint "Prometheus" "http://localhost:9090/-/ready"
check_endpoint "Grafana" "http://localhost:3001/grafana/api/health"
check_endpoint "Loki" "http://localhost:3100/ready"

# === Docker Container Status ===
echo ""
echo "--- Docker Containers ---"

EXPECTED_CONTAINERS="ecosfer-frontend ecosfer-dotnet ecosfer-ai ecosfer-db ecosfer-redis ecosfer-nginx ecosfer-prometheus ecosfer-grafana ecosfer-loki"

for container in $EXPECTED_CONTAINERS; do
    STATUS=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo "not_found")
    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "N/A")

    if [ "$STATUS" = "running" ]; then
        echo "[OK] $container: running (health: $HEALTH)"
    else
        echo "[FAIL] $container: $STATUS"
        ERRORS=$((ERRORS + 1))
    fi
done

# === Summary ===
echo ""
echo "================================"
echo "Errors: $ERRORS"
echo "================================"

if [ "$ERRORS" -gt 0 ]; then
    echo "RESULT: FAILED - $ERRORS service(s) not healthy"
    exit 1
else
    echo "RESULT: ALL SERVICES HEALTHY"
    exit 0
fi
