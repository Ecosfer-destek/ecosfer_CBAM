#!/bin/bash
# PostgreSQL Database Backup Script
# Usage: ./scripts/db-backup.sh [daily|weekly|manual]
# Retention: 7 daily, 4 weekly backups

set -euo pipefail

BACKUP_TYPE="${1:-manual}"
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_CONTAINER="ecosfer-db"

# Load environment variables
if [ -f .env ]; then
    set -a; source .env; set +a
fi

DB_USER="${DB_USER:-ecosfer}"
DB_NAME="${DB_NAME:-ecosfer_skdm}"

# Create backup directories
mkdir -p "$BACKUP_DIR/daily"
mkdir -p "$BACKUP_DIR/weekly"
mkdir -p "$BACKUP_DIR/manual"

BACKUP_FILE="$BACKUP_DIR/$BACKUP_TYPE/${DB_NAME}_${BACKUP_TYPE}_${DATE}.sql.gz"

echo "=== Database Backup ==="
echo "Type: $BACKUP_TYPE"
echo "Database: $DB_NAME"
echo "Output: $BACKUP_FILE"
echo ""

# Perform backup
if docker ps --format '{{.Names}}' | grep -q "$DB_CONTAINER"; then
    echo "Backing up via Docker container..."
    docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists | gzip > "$BACKUP_FILE"
else
    echo "Backing up via local pg_dump..."
    pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists | gzip > "$BACKUP_FILE"
fi

# Verify backup
BACKUP_SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null || echo "unknown")
echo "Backup created: $BACKUP_FILE ($BACKUP_SIZE bytes)"

# Cleanup old backups
echo ""
echo "Cleaning up old backups..."

# Keep 7 daily backups
DAILY_COUNT=$(ls -1 "$BACKUP_DIR/daily/" 2>/dev/null | wc -l)
if [ "$DAILY_COUNT" -gt 7 ]; then
    ls -1t "$BACKUP_DIR/daily/" | tail -n +8 | while read -r f; do
        echo "  Removing old daily: $f"
        rm "$BACKUP_DIR/daily/$f"
    done
fi

# Keep 4 weekly backups
WEEKLY_COUNT=$(ls -1 "$BACKUP_DIR/weekly/" 2>/dev/null | wc -l)
if [ "$WEEKLY_COUNT" -gt 4 ]; then
    ls -1t "$BACKUP_DIR/weekly/" | tail -n +5 | while read -r f; do
        echo "  Removing old weekly: $f"
        rm "$BACKUP_DIR/weekly/$f"
    done
fi

echo ""
echo "=== Backup complete ==="
echo ""
echo "Cron examples:"
echo "  Daily at 2am:   0 2 * * * cd /opt/ecosfer-skdm && ./scripts/db-backup.sh daily"
echo "  Weekly Sunday:   0 3 * * 0 cd /opt/ecosfer-skdm && ./scripts/db-backup.sh weekly"
