#!/bin/bash
# Environment Validation Script
# Checks all required environment variables and connectivity before deployment
# Usage: ./scripts/validate-env.sh

set -euo pipefail

ERRORS=0
WARNINGS=0

echo "=== Ecosfer SKDM Environment Validation ==="
echo ""

# Load .env if exists
if [ -f .env ]; then
    set -a; source .env; set +a
    echo "[OK] .env file found"
else
    echo "[FAIL] .env file not found"
    ERRORS=$((ERRORS + 1))
fi

# === Required Environment Variables ===
echo ""
echo "--- Required Variables ---"

check_var() {
    local var_name="$1"
    local var_value="${!var_name:-}"
    if [ -z "$var_value" ]; then
        echo "[FAIL] $var_name is not set"
        ERRORS=$((ERRORS + 1))
    else
        echo "[OK] $var_name is set"
    fi
}

check_var "DB_USER"
check_var "DB_PASSWORD"
check_var "DB_NAME"
check_var "REDIS_PASSWORD"
check_var "NEXTAUTH_URL"
check_var "NEXTAUTH_SECRET"

# === Default Password Check ===
echo ""
echo "--- Security Checks ---"

check_not_default() {
    local var_name="$1"
    local default_value="$2"
    local var_value="${!var_name:-}"
    if [ "$var_value" = "$default_value" ]; then
        echo "[FAIL] $var_name is using default value - CHANGE IT!"
        ERRORS=$((ERRORS + 1))
    elif [ -n "$var_value" ]; then
        echo "[OK] $var_name is not using default"
    fi
}

check_not_default "DB_PASSWORD" "CHANGE_ME_STRONG_PASSWORD"
check_not_default "REDIS_PASSWORD" "CHANGE_ME_REDIS_PASSWORD"
check_not_default "NEXTAUTH_SECRET" "CHANGE_ME_RANDOM_SECRET_AT_LEAST_32_CHARS"
check_not_default "GRAFANA_ADMIN_PASSWORD" "CHANGE_ME_GRAFANA_PASSWORD"

# NEXTAUTH_SECRET length check
SECRET_LEN=${#NEXTAUTH_SECRET:-}
if [ "$SECRET_LEN" -lt 32 ] 2>/dev/null; then
    echo "[FAIL] NEXTAUTH_SECRET is too short (minimum 32 characters)"
    ERRORS=$((ERRORS + 1))
else
    echo "[OK] NEXTAUTH_SECRET length is adequate ($SECRET_LEN chars)"
fi

# === Connectivity Checks ===
echo ""
echo "--- Connectivity Checks ---"

# PostgreSQL
if command -v pg_isready &> /dev/null; then
    if pg_isready -h localhost -p 5432 -U "${DB_USER:-ecosfer}" &> /dev/null; then
        echo "[OK] PostgreSQL is reachable"
    else
        echo "[WARN] PostgreSQL is not reachable on localhost:5432"
        WARNINGS=$((WARNINGS + 1))
    fi
elif docker ps --format '{{.Names}}' 2>/dev/null | grep -q "ecosfer-db"; then
    echo "[OK] PostgreSQL container is running"
else
    echo "[WARN] Cannot verify PostgreSQL connectivity"
    WARNINGS=$((WARNINGS + 1))
fi

# Redis
if command -v redis-cli &> /dev/null; then
    if redis-cli -h localhost -p 6379 -a "${REDIS_PASSWORD:-}" ping &> /dev/null; then
        echo "[OK] Redis is reachable"
    else
        echo "[WARN] Redis is not reachable on localhost:6379"
        WARNINGS=$((WARNINGS + 1))
    fi
elif docker ps --format '{{.Names}}' 2>/dev/null | grep -q "ecosfer-redis"; then
    echo "[OK] Redis container is running"
else
    echo "[WARN] Cannot verify Redis connectivity"
    WARNINGS=$((WARNINGS + 1))
fi

# === SSL Certificate Check ===
echo ""
echo "--- SSL Certificate Check ---"

SSL_DIR="./docker/nginx/ssl"
if [ -f "$SSL_DIR/fullchain.pem" ] && [ -f "$SSL_DIR/privkey.pem" ]; then
    echo "[OK] SSL certificates found"
    # Check expiration
    if command -v openssl &> /dev/null; then
        EXPIRY=$(openssl x509 -enddate -noout -in "$SSL_DIR/fullchain.pem" 2>/dev/null | cut -d= -f2)
        if [ -n "$EXPIRY" ]; then
            EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$EXPIRY" +%s 2>/dev/null || echo "0")
            NOW_EPOCH=$(date +%s)
            DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))
            if [ "$DAYS_LEFT" -lt 7 ]; then
                echo "[FAIL] SSL certificate expires in $DAYS_LEFT days - RENEW NOW!"
                ERRORS=$((ERRORS + 1))
            elif [ "$DAYS_LEFT" -lt 30 ]; then
                echo "[WARN] SSL certificate expires in $DAYS_LEFT days"
                WARNINGS=$((WARNINGS + 1))
            else
                echo "[OK] SSL certificate valid for $DAYS_LEFT days"
            fi
        fi
    fi
else
    echo "[WARN] SSL certificates not found in $SSL_DIR"
    WARNINGS=$((WARNINGS + 1))
fi

# === Disk Space Check ===
echo ""
echo "--- Disk Space ---"
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo "[FAIL] Disk usage is ${DISK_USAGE}% - critical!"
    ERRORS=$((ERRORS + 1))
elif [ "$DISK_USAGE" -gt 80 ]; then
    echo "[WARN] Disk usage is ${DISK_USAGE}%"
    WARNINGS=$((WARNINGS + 1))
else
    echo "[OK] Disk usage: ${DISK_USAGE}%"
fi

# === Docker Check ===
echo ""
echo "--- Docker ---"
if command -v docker &> /dev/null; then
    echo "[OK] Docker is installed ($(docker --version | head -1))"
    if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
        echo "[OK] Docker Compose is available"
    else
        echo "[FAIL] Docker Compose is not available"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "[FAIL] Docker is not installed"
    ERRORS=$((ERRORS + 1))
fi

# === Summary ===
echo ""
echo "================================"
echo "Errors:   $ERRORS"
echo "Warnings: $WARNINGS"
echo "================================"

if [ "$ERRORS" -gt 0 ]; then
    echo "RESULT: FAILED - Fix errors before deploying!"
    exit 1
else
    echo "RESULT: PASSED"
    exit 0
fi
