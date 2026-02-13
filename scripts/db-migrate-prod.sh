#!/bin/bash
# Production Database Migration Script
# Usage: ./scripts/db-migrate-prod.sh [--seed]

set -euo pipefail

SEED="${1:-}"
FRONTEND_DIR="./frontend"

# Load environment variables
if [ -f .env ]; then
    set -a; source .env; set +a
fi

echo "=== Production Database Migration ==="
echo ""

# Check DATABASE_URL
if [ -z "${DATABASE_URL:-}" ]; then
    DB_USER="${DB_USER:-ecosfer}"
    DB_PASSWORD="${DB_PASSWORD:-}"
    DB_NAME="${DB_NAME:-ecosfer_skdm}"
    export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public"
fi

echo "Connecting to: ${DATABASE_URL%%@*}@***"
echo ""

# Run Prisma migrations
echo "Running Prisma migrations..."
cd "$FRONTEND_DIR"
npx prisma migrate deploy
echo "Migrations applied successfully."

# Optional: Run seed data
if [ "$SEED" = "--seed" ]; then
    echo ""
    echo "Running seed data..."
    npx tsx prisma/seed.ts
    echo "Seed data applied successfully."
fi

echo ""
echo "=== Migration complete ==="
