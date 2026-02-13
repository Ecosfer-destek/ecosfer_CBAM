#!/bin/bash
# PostgreSQL Database Restore Script
# Usage: ./scripts/db-restore.sh <backup_file>
# Example: ./scripts/db-restore.sh ./backups/daily/ecosfer_skdm_daily_20260210_020000.sql.gz

set -euo pipefail

BACKUP_FILE="${1:-}"
DB_CONTAINER="ecosfer-db"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    echo ""
    echo "Available backups:"
    ls -lt backups/daily/ backups/weekly/ backups/manual/ 2>/dev/null || echo "  No backups found"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Load environment variables
if [ -f .env ]; then
    set -a; source .env; set +a
fi

DB_USER="${DB_USER:-ecosfer}"
DB_NAME="${DB_NAME:-ecosfer_skdm}"

echo "=== Database Restore ==="
echo "Source: $BACKUP_FILE"
echo "Database: $DB_NAME"
echo ""
echo "WARNING: This will overwrite the current database!"
read -p "Are you sure? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo ""
echo "Restoring database..."

if docker ps --format '{{.Names}}' | grep -q "$DB_CONTAINER"; then
    gunzip -c "$BACKUP_FILE" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"
else
    gunzip -c "$BACKUP_FILE" | psql -U "$DB_USER" -d "$DB_NAME"
fi

echo ""
echo "=== Restore complete ==="
