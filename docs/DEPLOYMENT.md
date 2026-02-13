# Ecosfer SKDM v2.0 - Deployment & Operations Guide

This document covers the complete deployment, configuration, monitoring, and maintenance procedures for the Ecosfer SKDM v2.0 platform.

---

## 1. Prerequisites

### System Requirements

| Requirement | Minimum | Recommended |
|---|---|---|
| Docker | 24.0+ | Latest stable |
| Docker Compose | v2.20+ | Latest stable |
| RAM | 4 GB | 8 GB |
| Disk | 20 GB | 50 GB |
| CPU | 2 cores | 4 cores |
| OS | Ubuntu 22.04 / Debian 12 | Ubuntu 24.04 LTS |

### Domain and Network

- **Domain**: `cbam.ecosfer.com`
- **DNS**: A record pointing to the server's public IP
- **Ports**: 80 (HTTP), 443 (HTTPS) must be open
- **SSL Certificate**: Let's Encrypt recommended (see Section 4)

### Verify Docker Installation

```bash
docker --version        # Docker 24.0+
docker compose version  # Docker Compose v2.20+
```

If Docker is not installed:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

---

## 2. Environment Configuration

### Setting Up the Environment File

Copy the example environment file and configure all values:

```bash
cp .env.example .env
chmod 600 .env
```

### Environment Variables Reference

| Variable | Description | Example |
|---|---|---|
| `DB_USER` | PostgreSQL username | `skdm_user` |
| `DB_PASSWORD` | PostgreSQL password | *(strong password, see below)* |
| `DB_NAME` | PostgreSQL database name | `skdm_production` |
| `REDIS_PASSWORD` | Redis authentication password | *(strong password, see below)* |
| `NEXTAUTH_URL` | Public URL of the application | `https://cbam.ecosfer.com` |
| `NEXTAUTH_SECRET` | NextAuth.js session signing key | *(generated, see below)* |
| `REGISTRY` | Container registry URL | `ghcr.io` |
| `IMAGE_PREFIX` | Image name prefix | `ecosfer/skdm` |
| `TAG` | Docker image tag | `latest` or `v2.0.0` |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key | `sk-ant-...` |
| `OPENAI_API_KEY` | OpenAI GPT-4 API key | `sk-...` |
| `GRAFANA_ADMIN_USER` | Grafana admin username | `admin` |
| `GRAFANA_ADMIN_PASSWORD` | Grafana admin password | *(strong password, see below)* |

### Security: Generating Secrets

**Generate NEXTAUTH_SECRET:**

```bash
openssl rand -base64 32
```

**Generate strong passwords for DB_PASSWORD, REDIS_PASSWORD, and GRAFANA_ADMIN_PASSWORD:**

```bash
openssl rand -base64 24
```

### Example .env File

```env
# Database
DB_USER=skdm_user
DB_PASSWORD=YourStr0ng!DbP@ssword2026
DB_NAME=skdm_production

# Redis
REDIS_PASSWORD=YourStr0ng!RedisP@ssword2026

# NextAuth
NEXTAUTH_URL=https://cbam.ecosfer.com
NEXTAUTH_SECRET=abc123def456ghi789jkl012mno345pqr678stu=

# Container Registry
REGISTRY=ghcr.io
IMAGE_PREFIX=ecosfer/skdm
TAG=latest

# AI Service API Keys
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxx

# Grafana
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=YourStr0ng!GrafanaP@ssword2026
```

> **IMPORTANT**: Never commit the `.env` file to version control. It is already included in `.gitignore`.

---

## 3. Docker Compose Deployment

### Architecture Overview

The `docker-compose.prod.yml` file defines 10 services:

| Service | Image / Build | Internal Port | Purpose |
|---|---|---|---|
| `db` | PostgreSQL 16 | 5432 | Primary database |
| `redis` | Redis 7 | 6379 | Caching and sessions |
| `frontend` | Next.js 15 | 3000 | Web application |
| `dotnet` | .NET 9 Minimal API | 5100 | Excel/XML/PDF services |
| `ai` | Python FastAPI | 8000 | AI forecasting/anomaly/narrative |
| `nginx` | Nginx | 80, 443 | Reverse proxy and load balancer |
| `prometheus` | Prometheus | 9090 | Metrics collection |
| `grafana` | Grafana | 3001 | Dashboards and alerting |
| `loki` | Loki | 3100 | Log aggregation |
| `promtail` | Promtail | 9080 | Log shipping from containers |
| `node-exporter` | Node Exporter | 9100 | Host system metrics |

### Step-by-Step Deployment

#### Step 1: Clone the Repository

```bash
git clone https://github.com/ecosfer/skdm-panel.git
cd skdm-panel/ecosfer-skdm-v2
```

#### Step 2: Configure Environment

```bash
cp .env.example .env
# Edit .env with your production values (see Section 2)
nano .env
```

#### Step 3: Build Docker Images

```bash
docker compose -f docker-compose.prod.yml build
```

This builds the `frontend`, `dotnet`, and `ai` service images. Infrastructure services (db, redis, nginx, prometheus, grafana, loki, promtail, node-exporter) use pre-built images.

#### Step 4: Start Infrastructure Services First

```bash
docker compose -f docker-compose.prod.yml up -d db redis
```

Wait for PostgreSQL to be ready:

```bash
docker compose -f docker-compose.prod.yml exec db pg_isready -U $DB_USER
```

#### Step 5: Run Database Migrations and Seed Data (First-Time Only)

```bash
# Run Prisma schema push to create/update tables
docker compose -f docker-compose.prod.yml exec frontend npx prisma db push

# Run seed data (countries, cities, CN codes, units, roles)
docker compose -f docker-compose.prod.yml exec frontend npx prisma db seed
```

The seed script (`prisma/seed.ts`) populates:
- 39 countries
- 30 cities
- 26 districts
- 60+ CN codes
- Unit definitions
- Default roles and permissions

#### Step 6: Start All Services

```bash
docker compose -f docker-compose.prod.yml up -d
```

#### Step 7: Verify Deployment

```bash
# Check all containers are running
docker compose -f docker-compose.prod.yml ps

# Check health endpoints
curl http://localhost/nginx-health
curl http://localhost:3000/health
curl http://localhost:5100/health
curl http://localhost:8000/health
```

All services should report status `Up` with health status `healthy`.

### Stopping and Restarting

```bash
# Stop all services (preserves data volumes)
docker compose -f docker-compose.prod.yml down

# Stop and remove volumes (DESTROYS DATA)
docker compose -f docker-compose.prod.yml down -v

# Restart a specific service
docker compose -f docker-compose.prod.yml restart frontend

# Rebuild and restart a specific service
docker compose -f docker-compose.prod.yml up -d --build frontend
```

### Updating to a New Version

```bash
# Pull latest code
git pull origin main

# Rebuild and restart with zero downtime
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Run any new migrations
docker compose -f docker-compose.prod.yml exec frontend npx prisma migrate deploy
```

---

## 4. SSL/TLS Configuration

### Option A: Let's Encrypt with Certbot (Recommended)

#### Install Certbot on the Host

```bash
sudo apt install certbot
```

#### Obtain the Certificate

```bash
# Stop nginx temporarily to free port 80
docker compose -f docker-compose.prod.yml stop nginx

# Obtain certificate
sudo certbot certonly --standalone -d cbam.ecosfer.com

# Restart nginx
docker compose -f docker-compose.prod.yml start nginx
```

Certificates are stored at:
- Certificate: `/etc/letsencrypt/live/cbam.ecosfer.com/fullchain.pem`
- Private Key: `/etc/letsencrypt/live/cbam.ecosfer.com/privkey.pem`

#### Mount Certificates in Docker Compose

Add the following volume mounts to the `nginx` service in `docker-compose.prod.yml`:

```yaml
nginx:
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - /etc/letsencrypt/live/cbam.ecosfer.com:/etc/nginx/ssl:ro
    - /etc/letsencrypt/archive/cbam.ecosfer.com:/etc/nginx/ssl-archive:ro
```

#### Enable HTTPS in Nginx Configuration

Uncomment the HTTPS redirect block in `nginx/nginx.conf`:

```nginx
# Uncomment to enable HTTP -> HTTPS redirect
server {
    listen 80;
    server_name cbam.ecosfer.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cbam.ecosfer.com;

    ssl_certificate     /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # ... existing location blocks ...
}
```

#### Auto-Renewal

Set up a cron job for automatic certificate renewal:

```bash
sudo crontab -e
```

Add:

```cron
0 3 * * * certbot renew --pre-hook "docker compose -f /path/to/docker-compose.prod.yml stop nginx" --post-hook "docker compose -f /path/to/docker-compose.prod.yml start nginx" >> /var/log/certbot-renew.log 2>&1
```

### Option B: Custom SSL Certificate

If using a purchased certificate, place the files and update the nginx volumes accordingly:

```yaml
nginx:
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ./certs/fullchain.pem:/etc/nginx/ssl/fullchain.pem:ro
    - ./certs/privkey.pem:/etc/nginx/ssl/privkey.pem:ro
```

---

## 5. Database Management

### PostgreSQL 16 Configuration

The database runs in a Docker container with a persistent volume:

```yaml
db:
  image: postgres:16
  volumes:
    - pgdata:/var/lib/postgresql/data
  environment:
    POSTGRES_USER: ${DB_USER}
    POSTGRES_PASSWORD: ${DB_PASSWORD}
    POSTGRES_DB: ${DB_NAME}
```

The named volume `pgdata` ensures data survives container restarts.

### Backup

#### Manual Backup

```bash
# Full database dump (compressed custom format)
docker compose -f docker-compose.prod.yml exec db \
  pg_dump -U $DB_USER -d $DB_NAME -Fc -f /tmp/skdm_backup.dump

# Copy backup to host
docker compose -f docker-compose.prod.yml cp db:/tmp/skdm_backup.dump ./backups/

# SQL format backup (human-readable)
docker compose -f docker-compose.prod.yml exec db \
  pg_dump -U $DB_USER -d $DB_NAME > ./backups/skdm_backup_$(date +%Y%m%d).sql
```

#### Automated Daily Backup (Cron)

Create a backup script at `/opt/skdm/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/skdm/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

# Create backup
docker compose -f /opt/skdm/docker-compose.prod.yml exec -T db \
  pg_dump -U skdm_user -d skdm_production -Fc \
  > "$BACKUP_DIR/skdm_$DATE.dump"

# Remove backups older than retention period
find $BACKUP_DIR -name "skdm_*.dump" -mtime +$RETENTION_DAYS -delete

echo "$(date): Backup completed - skdm_$DATE.dump" >> /var/log/skdm-backup.log
```

```bash
chmod +x /opt/skdm/backup.sh
sudo crontab -e
# Add: 0 2 * * * /opt/skdm/backup.sh
```

### Restore

```bash
# Restore from custom format dump
docker compose -f docker-compose.prod.yml exec -T db \
  pg_restore -U $DB_USER -d $DB_NAME --clean --if-exists < ./backups/skdm_backup.dump

# Restore from SQL format
docker compose -f docker-compose.prod.yml exec -T db \
  psql -U $DB_USER -d $DB_NAME < ./backups/skdm_backup.sql
```

### Prisma Migrations

```bash
# Apply pending migrations in production
docker compose -f docker-compose.prod.yml exec frontend npx prisma migrate deploy

# Check migration status
docker compose -f docker-compose.prod.yml exec frontend npx prisma migrate status

# Push schema changes directly (use only for development or initial setup)
docker compose -f docker-compose.prod.yml exec frontend npx prisma db push
```

> **NOTE**: In production, always use `prisma migrate deploy` instead of `prisma db push`. The `db push` command does not create migration history and may cause data loss.

---

## 6. Monitoring Stack

### Prometheus (Port 9090)

**Purpose**: Metrics collection and alerting engine.

**Configuration**:
- Scrape interval: 15 seconds
- Data retention: 30 days
- Storage: Docker volume `prometheus_data`

**Metrics Collected**:
- Application metrics from frontend, dotnet, and ai services
- Container metrics from Docker daemon
- Host metrics from node-exporter
- Nginx metrics from stub_status

**Alert Rules (9 rules)**:

| Alert | Condition | Severity | Description |
|---|---|---|---|
| `ServiceDown` | Instance unreachable for 1 min | critical | Any monitored service is down |
| `HighErrorRate` | HTTP 5xx > 5% for 5 min | critical | High rate of server errors |
| `HighResponseTime` | p95 latency > 2s for 5 min | warning | Slow response times |
| `HighMemory` | Container memory > 90% limit for 5 min | warning | Memory pressure on a service |
| `HighCPU` | Container CPU > 80% for 10 min | warning | Sustained high CPU usage |
| `DiskSpaceLow` | Disk usage > 85% | warning | Host disk space running low |
| `DbConnectionPool` | Active connections > 80% pool for 5 min | warning | Database connection pool exhaustion |
| `ExcelImportFailure` | Import error rate > 10% for 15 min | warning | Excel import service degradation |
| `AiServiceDegraded` | AI endpoint latency > 10s for 5 min | warning | AI service performance degradation |

Access Prometheus at: `http://<server-ip>:9090`

### Grafana (Port 3001, Subpath /grafana/)

**Purpose**: Visualization dashboards and alert management.

**Access**: `http://<server-ip>:3001/grafana/` or via nginx at `https://cbam.ecosfer.com/grafana/`

**Default Credentials**: Set via `GRAFANA_ADMIN_USER` and `GRAFANA_ADMIN_PASSWORD` environment variables.

**Pre-configured Dashboards (3)**:

1. **System Overview Dashboard**
   - Host CPU, memory, disk usage (from node-exporter)
   - Container resource consumption per service
   - Network I/O rates
   - PostgreSQL connection count and query rate

2. **Service Health Dashboard**
   - Request rate and error rate per service (frontend, dotnet, ai)
   - Response time percentiles (p50, p95, p99)
   - Active connections per service
   - Health check status indicators

3. **Logs Dashboard**
   - Live log stream from all services (via Loki data source)
   - Error log filtering and search
   - Log volume over time
   - Service-specific log panels

**Data Sources** (auto-provisioned):
- Prometheus: `http://prometheus:9090`
- Loki: `http://loki:3100`

### Loki (Port 3100)

**Purpose**: Log aggregation and querying.

**Configuration**:
- Log retention: 30 days
- Storage: Docker volume `loki_data`
- Index: BoltDB Shipper
- Chunks: Filesystem

**Query Examples** (use in Grafana Explore or Logs dashboard):

```logql
# All error logs from frontend
{container="frontend"} |= "error"

# Slow API responses from dotnet service
{container="dotnet"} |= "elapsed" | json | elapsed > 1000

# AI service exceptions
{container="ai"} |= "Traceback"

# All logs from last hour for a specific service
{container="nginx"} | json
```

### Promtail (Port 9080)

**Purpose**: Automatic log collection from Docker containers.

**How It Works**:
- Discovers Docker containers automatically
- Ships container stdout/stderr to Loki
- Adds labels: container name, service name, compose project
- No manual configuration needed for new services

### Node Exporter (Port 9100)

**Purpose**: Host-level system metrics.

**Metrics Exported**:
- CPU usage per core and aggregate
- Memory usage (total, available, cached, buffered)
- Disk I/O and space usage per mount
- Network interface statistics
- System load averages

Access raw metrics at: `http://<server-ip>:9100/metrics`

---

## 7. Service Endpoints

### Internal Service Map

| Service | Internal URL | Health Check |
|---|---|---|
| Frontend (Next.js) | `http://frontend:3000` | `GET /health` |
| .NET API | `http://dotnet:5100` | `GET /health` |
| AI Service (FastAPI) | `http://ai:8000` | `GET /health` |
| PostgreSQL | `db:5432` | `pg_isready` |
| Redis | `redis:6379` | `redis-cli ping` |
| Nginx | `http://nginx:80` | `GET /nginx-health` |

### Public Endpoints (via Nginx)

| Path | Backend | Description |
|---|---|---|
| `/` | `frontend:3000` | Next.js web application |
| `/api/v1/excel/*` | `dotnet:5100` | Excel import/export services |
| `/api/v1/xml/*` | `dotnet:5100` | CBAM XML generation and validation |
| `/api/v1/reports/*` | `dotnet:5100` | PDF report generation |
| `/api/v1/forecast/*` | `ai:8000` | AI emission forecasting |
| `/api/v1/analysis/*` | `ai:8000` | AI anomaly detection and narrative |
| `/nginx-health` | Nginx internal | Nginx health status |
| `/grafana/` | `grafana:3001` | Monitoring dashboards |

### Health Check Verification

```bash
# Nginx reverse proxy
curl -s http://localhost/nginx-health
# Expected: "healthy"

# Frontend
curl -s http://localhost:3000/health
# Expected: {"status":"ok"}

# .NET API
curl -s http://localhost:5100/health
# Expected: {"status":"Healthy"}

# AI Service
curl -s http://localhost:8000/health
# Expected: {"status":"healthy","services":{"db":"connected","redis":"connected"}}

# PostgreSQL
docker compose -f docker-compose.prod.yml exec db pg_isready -U $DB_USER
# Expected: accepting connections

# Redis
docker compose -f docker-compose.prod.yml exec redis redis-cli -a $REDIS_PASSWORD ping
# Expected: PONG
```

---

## 8. Scaling Considerations

### Resource Limits per Service

The following resource limits are defined in `docker-compose.prod.yml`:

| Service | CPU Limit | Memory Limit | Memory Reservation |
|---|---|---|---|
| `db` (PostgreSQL) | 2.0 | 2 GB | 1 GB |
| `redis` | 0.5 | 512 MB | 256 MB |
| `frontend` (Next.js) | 2.0 | 1 GB | 512 MB |
| `dotnet` (.NET API) | 2.0 | 1 GB | 512 MB |
| `ai` (FastAPI) | 2.0 | 2 GB | 1 GB |
| `nginx` | 1.0 | 256 MB | 128 MB |
| `prometheus` | 1.0 | 1 GB | 512 MB |
| `grafana` | 1.0 | 512 MB | 256 MB |
| `loki` | 1.0 | 512 MB | 256 MB |
| `promtail` | 0.5 | 256 MB | 128 MB |
| `node-exporter` | 0.5 | 128 MB | 64 MB |

### Redis Configuration

- **Max memory**: 256 MB
- **Eviction policy**: `allkeys-lru` (Least Recently Used)
- **Persistence**: AOF enabled for durability
- Used for: session caching, AI result caching, rate limiting

### AI Service Scaling

The AI service runs with **2 Uvicorn workers** by default:

```dockerfile
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

To increase workers for higher concurrency:

```yaml
# In docker-compose.prod.yml, override the command
ai:
  command: uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
  deploy:
    resources:
      limits:
        cpus: '4.0'
        memory: 4G
```

**Rule of thumb**: Set workers to `(2 * CPU cores) + 1` for the AI service, and ensure the memory limit is increased proportionally (approximately 500 MB per worker).

### Horizontal Scaling Notes

- **Frontend**: Can be scaled to multiple replicas behind nginx. Ensure `NEXTAUTH_SECRET` is identical across all instances.
- **.NET API**: Stateless; can be scaled horizontally without changes.
- **AI Service**: Stateless; scale by increasing workers or adding replicas.
- **Database**: Vertical scaling only. For read-heavy workloads, consider adding read replicas.
- **Redis**: Single instance is sufficient for current scale. For HA, consider Redis Sentinel.

---

## 9. Troubleshooting

### Common Issues

#### Port Conflicts

**Symptom**: Container fails to start with "port already in use" error.

```bash
# Find what's using a port
sudo lsof -i :80
sudo lsof -i :5432

# Stop the conflicting process or change the port mapping in docker-compose.prod.yml
```

#### Database Connection Failures

**Symptom**: Frontend or .NET service cannot connect to PostgreSQL.

```bash
# Check if db container is running and healthy
docker compose -f docker-compose.prod.yml ps db

# Check db logs
docker compose -f docker-compose.prod.yml logs db --tail 50

# Test connection from inside a container
docker compose -f docker-compose.prod.yml exec frontend sh -c \
  "nc -zv db 5432"

# Verify DATABASE_URL is correct
docker compose -f docker-compose.prod.yml exec frontend printenv DATABASE_URL
```

#### Prisma Migration Issues

**Symptom**: `prisma migrate deploy` fails with drift or schema mismatch.

```bash
# Check migration status
docker compose -f docker-compose.prod.yml exec frontend npx prisma migrate status

# If the database has drifted, resolve with:
docker compose -f docker-compose.prod.yml exec frontend npx prisma migrate resolve --applied <migration_name>

# For a fresh start (DESTROYS DATA - development only):
docker compose -f docker-compose.prod.yml exec frontend npx prisma migrate reset
```

#### Redis Connection Issues

**Symptom**: Session errors or caching failures.

```bash
# Check Redis container
docker compose -f docker-compose.prod.yml logs redis --tail 20

# Test Redis from inside a service
docker compose -f docker-compose.prod.yml exec redis redis-cli -a $REDIS_PASSWORD ping

# Check memory usage
docker compose -f docker-compose.prod.yml exec redis redis-cli -a $REDIS_PASSWORD info memory
```

#### AI Service Not Responding

**Symptom**: AI dashboard shows errors or timeouts.

```bash
# Check AI service logs
docker compose -f docker-compose.prod.yml logs ai --tail 50

# Verify API keys are set
docker compose -f docker-compose.prod.yml exec ai printenv ANTHROPIC_API_KEY | head -c 10

# Test health endpoint directly
docker compose -f docker-compose.prod.yml exec ai curl -s http://localhost:8000/health
```

#### Container Out of Memory (OOM)

**Symptom**: Container restarts with exit code 137.

```bash
# Check container stats
docker stats --no-stream

# Check for OOM events
docker compose -f docker-compose.prod.yml logs <service> | grep -i "killed"

# Increase memory limit in docker-compose.prod.yml
```

### Log Viewing

#### Docker Compose Logs

```bash
# Follow all service logs
docker compose -f docker-compose.prod.yml logs -f

# Follow a specific service
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f dotnet
docker compose -f docker-compose.prod.yml logs -f ai
docker compose -f docker-compose.prod.yml logs -f nginx

# Last 100 lines from a service
docker compose -f docker-compose.prod.yml logs --tail 100 frontend

# Logs since a specific time
docker compose -f docker-compose.prod.yml logs --since "2026-02-10T10:00:00" frontend
```

#### Grafana Logs Dashboard

1. Navigate to `https://cbam.ecosfer.com/grafana/`
2. Open the **Logs** dashboard
3. Use the service dropdown to filter by container
4. Use the search bar for full-text log search

#### Loki Direct Queries

Access Grafana Explore and select the Loki data source:

```logql
# Errors across all services
{job="docker"} |= "error" | line_format "{{.container}}: {{.message}}"

# HTTP 500 errors from nginx access log
{container="nginx"} | json | status >= 500

# Slow database queries (from frontend logs)
{container="frontend"} |= "prisma:query" | json | duration > 1000
```

### Health Check Commands Summary

```bash
# Quick status check for all services
docker compose -f docker-compose.prod.yml ps

# Comprehensive health verification script
for service in frontend dotnet ai; do
  echo -n "$service: "
  curl -s -o /dev/null -w "%{http_code}" http://localhost:$(docker compose -f docker-compose.prod.yml port $service $(docker compose -f docker-compose.prod.yml config --format json | python3 -c "import sys,json; svc=json.load(sys.stdin)['services']['$service']; print(list(svc.get('ports',[])[0].values())[0] if svc.get('ports') else 'N/A')"))/health
  echo
done

# Simpler approach - check each endpoint individually
echo "Nginx:    $(curl -s -o /dev/null -w '%{http_code}' http://localhost/nginx-health)"
echo "Frontend: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/health)"
echo "DotNet:   $(curl -s -o /dev/null -w '%{http_code}' http://localhost:5100/health)"
echo "AI:       $(curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/health)"
```

---

## 10. CI/CD Pipeline

### GitHub Actions CI (Continuous Integration)

**Trigger**: Pull requests and pushes to `main` branch.

**File**: `.github/workflows/ci.yml`

**4 Parallel Jobs**:

| Job | Steps | Purpose |
|---|---|---|
| `frontend` | Install deps, lint, type-check, unit tests | Validate Next.js application |
| `dotnet` | Restore, build, unit tests | Validate .NET API service |
| `python` | Install deps, lint (ruff), type-check (mypy), unit tests (pytest) | Validate AI service |
| `docker-build` | Build all Docker images (no push) | Verify Dockerfiles are valid |

```yaml
# CI is triggered automatically on:
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
```

### GitHub Actions Deploy (Continuous Deployment)

**Trigger**: Git tags matching `v*` pattern (e.g., `v2.0.0`) or manual dispatch.

**File**: `.github/workflows/deploy.yml`

**Steps**:

1. **Checkout** code at the tagged commit
2. **Login** to GitHub Container Registry (GHCR)
3. **Build** Docker images for all 3 application services
4. **Tag** images with three tags:
   - Semantic version from git tag (e.g., `v2.0.0`)
   - Git SHA short hash (e.g., `abc1234`)
   - `latest`
5. **Push** all tagged images to GHCR

### Docker Image Tags

| Tag Pattern | Example | Usage |
|---|---|---|
| Semantic version | `ghcr.io/ecosfer/skdm-frontend:v2.0.0` | Production releases |
| Git SHA | `ghcr.io/ecosfer/skdm-frontend:abc1234` | Traceability to exact commit |
| `latest` | `ghcr.io/ecosfer/skdm-frontend:latest` | Development/staging |

### Creating a Release

```bash
# Tag the release
git tag -a v2.0.0 -m "Release v2.0.0: MVP launch"
git push origin v2.0.0

# This triggers the deploy workflow which:
# 1. Builds all images
# 2. Pushes to GHCR with version, SHA, and latest tags
```

### Deploying a Release to Production

After the deploy workflow completes:

```bash
# On the production server, update the TAG in .env
sed -i 's/^TAG=.*/TAG=v2.0.0/' .env

# Pull new images and restart
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Run any pending migrations
docker compose -f docker-compose.prod.yml exec frontend npx prisma migrate deploy

# Verify deployment
docker compose -f docker-compose.prod.yml ps
```

### Manual Deployment Trigger

The deploy workflow can also be triggered manually from the GitHub Actions UI:

1. Navigate to **Actions** tab in the repository
2. Select **Deploy** workflow
3. Click **Run workflow**
4. Select the branch and optionally override the image tag
5. Click **Run workflow**

---

## Quick Reference

### Essential Commands

```bash
# Start everything
docker compose -f docker-compose.prod.yml up -d

# Stop everything (keep data)
docker compose -f docker-compose.prod.yml down

# View status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f [service]

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Database backup
docker compose -f docker-compose.prod.yml exec db pg_dump -U $DB_USER -d $DB_NAME -Fc > backup.dump

# Run migrations
docker compose -f docker-compose.prod.yml exec frontend npx prisma migrate deploy

# Check disk usage
docker system df
```

### Important URLs

| URL | Purpose |
|---|---|
| `https://cbam.ecosfer.com` | Application |
| `https://cbam.ecosfer.com/grafana/` | Monitoring dashboards |
| `http://<server-ip>:9090` | Prometheus (internal) |
| `http://<server-ip>:3001/grafana/` | Grafana direct access |

### Emergency Procedures

**Service is completely down**:
```bash
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

**Database corruption suspected**:
```bash
# Stop application services
docker compose -f docker-compose.prod.yml stop frontend dotnet ai

# Restore from latest backup
docker compose -f docker-compose.prod.yml exec -T db pg_restore -U $DB_USER -d $DB_NAME --clean --if-exists < /opt/skdm/backups/latest.dump

# Restart application services
docker compose -f docker-compose.prod.yml start frontend dotnet ai
```

**Rollback to previous version**:
```bash
# Update TAG to previous version
sed -i 's/^TAG=.*/TAG=v1.9.0/' .env

# Pull and restart
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

---

## Production Deployment Checklist

### Pre-Deploy
- [ ] Run environment validation: `./scripts/validate-env.sh`
- [ ] Verify all required env vars are set in `.env` (not default values)
- [ ] SSL certificates are valid (`./docker/nginx/ssl/`)
- [ ] Database backup taken: `./scripts/db-backup.sh manual`
- [ ] All tests pass locally: `npm run test`, `dotnet test`, `python -m pytest`
- [ ] Docker images build successfully: `docker compose -f docker-compose.prod.yml build`
- [ ] Git branch is clean, no uncommitted changes
- [ ] CHANGELOG.md is updated

### Deploy
```bash
# 1. Pull latest code
git pull origin main

# 2. Validate environment
./scripts/validate-env.sh

# 3. Build and start services
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# 4. Run database migrations
./scripts/db-migrate-prod.sh

# 5. Verify deployment
./scripts/health-check.sh https://cbam.ecosfer.com
```

### Post-Deploy
- [ ] Run health check: `./scripts/health-check.sh https://cbam.ecosfer.com`
- [ ] Login test: all 3 tenants (ecosfer, roder, borubar)
- [ ] Excel import test: upload a test CBAM file
- [ ] Excel export test: download installation data
- [ ] PDF report generation test
- [ ] AI analysis page loads (forecast/anomaly/narrative tabs)
- [ ] Grafana dashboards show data (`/grafana/`)
- [ ] Check logs: `docker compose -f docker-compose.prod.yml logs --tail=50`

### Rollback Procedure
```bash
# 1. Stop current deployment
docker compose -f docker-compose.prod.yml down

# 2. Switch to previous version
git checkout <previous-tag>
# OR update TAG in .env

# 3. Restart
docker compose -f docker-compose.prod.yml up -d

# 4. Restore database if needed
./scripts/db-restore.sh ./backups/manual/<latest-backup>.sql.gz

# 5. Verify rollback
./scripts/health-check.sh https://cbam.ecosfer.com
```
