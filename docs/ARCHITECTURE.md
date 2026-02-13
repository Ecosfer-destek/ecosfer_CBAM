# Ecosfer SKDM v2.0 - System Architecture

## 1. System Overview

Ecosfer SKDM (Surdurulebilirlik Karbon Duzenleme Mekanizmasi) is a **CBAM (Carbon Border Adjustment Mechanism)** sustainability data management platform. It enables operators, declarants, and verifiers to track carbon emissions, manage installations, generate regulatory declarations, and collaborate with suppliers on emission data.

The system was migrated from **v1.0** (.NET 8 + DevExpress XAF 23.2.6 + Blazor Server + XPO ORM + SQL Server monolith) to **v2.0**, a modern microservices architecture with a clear separation of concerns:

- **Frontend**: Next.js 16 with React 19 for the web application
- **Document Service**: .NET 9 Minimal API for Excel import, XML generation, and PDF reports
- **AI/ML Service**: Python FastAPI for emission forecasting, anomaly detection, and narrative reporting
- **Database**: PostgreSQL 16 as the primary data store, Redis 7 for caching

The architecture follows a **3-tier model**: Frontend + Backend Services + Database, with Nginx as a reverse proxy handling routing, rate limiting, and security headers.

## 2. Architecture Diagram

```
                          +------------------+
                          |     Browser      |
                          +--------+---------+
                                   |
                                   v
                     +-------------+--------------+
                     |   Nginx Reverse Proxy :80   |
                     |   (rate limiting, headers)  |
                     +----+--------+--------+------+
                          |        |        |
                +---------+--+ +---+------+ +--+---------+
                |  Next.js   | | .NET 9   | |  Python    |
                |  Frontend  | | Document | |  AI/ML     |
                |  :3000     | | Service  | |  Service   |
                |            | | :5100    | |  :8000     |
                | - App      | |          | |            |
                |   Router   | | - Excel  | | - Forecast |
                | - Auth     | | - XML    | | - Anomaly  |
                | - Prisma   | | - PDF    | | - Narrative|
                +---------+--+ +---+------+ +--+---------+
                          |        |        |
                          +--------+--------+
                                   |
                     +-------------+--------------+
                     |                            |
              +------+-------+          +---------+------+
              | PostgreSQL 16|          |    Redis 7     |
              | :5432        |          |    :6379       |
              | (82 models)  |          |    (cache)     |
              +--------------+          +----------------+

        +------------------+    +------------------+
        |   Prometheus     +--->+    Grafana        |
        |   :9090          |    |    :3001          |
        +--------+---------+    +------------------+
                 |
        +--------+---------+
        |  5 scrape targets|
        |  (15s interval)  |
        +------------------+

        +------------------+    +------------------+
        |      Loki        +<---+    Promtail       |
        |   :3100          |    |   (log shipper)   |
        +------------------+    +------------------+

        +------------------+
        |  Node Exporter   |
        |  :9100           |
        +------------------+
```

## 3. Frontend Architecture

The frontend is built with **Next.js 16** using the App Router pattern and React 19 Server Components.

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js | 16.1.6 | App Router, RSC, Server Actions |
| Runtime | React | 19 | UI rendering, Server Components |
| Language | TypeScript | Strict mode | Type safety, zero errors policy |
| Auth | NextAuth.js | v5 | Credentials provider, session management |
| ORM | Prisma | 7.3.0 | Type-safe DB queries, migrations |
| DB Adapter | @prisma/adapter-pg + pg | - | PostgreSQL connection pooling |
| Validation | Zod | v4 | Schema validation (auth, company, emission, etc.) |
| State | Zustand | - | Declaration wizard state management |
| Forms | React Hook Form | - | Form state + Zod resolver |
| UI Components | shadcn/ui | - | Radix UI primitives + Tailwind CSS 4 |
| Tables | TanStack Table | v8 | Sorting, filtering, pagination |
| Charts | Recharts | 3.x | AI dashboard visualizations |
| i18n | next-intl | v4.8.2 | TR/EN/DE, cookie-based locale |

### Key Patterns

- **Server Actions** for CRUD operations (Company, Installation, Emission, Balance, etc.)
- **Server Components** for data fetching with Prisma
- **Client Components** for interactive forms and tables
- **Route Groups**: `(dashboard)/` for admin, `(supplier)/` for supplier portal
- **Prisma Client**: Requires `@prisma/adapter-pg` with `pg` Pool constructor; imports from `@/generated/prisma/client` (not `@prisma/client`)
- **Zod v4**: Error access via `error.issues[0].message` (not `errors`)

### Page Structure

```
app/
  (dashboard)/
    dashboard/
      companies/           # Company CRUD
      installations/       # Installation CRUD
      installation-data/   # 5-tab form, Excel upload, PDF reports
      emissions/           # Conditional SS/PFC/ES form
      balances/            # FuelBalance, GhgBalance
      reports/             # Report CRUD
      declarations/        # Declaration CRUD, 7-step wizard, XML generation
      certificates/        # CbamCertificate, inline Surrender/Adjustment
      monitoring-plans/    # MonitoringPlan CRUD
      authorisation/       # AuthorisationApplication, verification
      suppliers/           # Supplier management, invitations
      ai-analysis/         # 3-tab AI dashboard
      settings/            # Tenant settings, security
  (supplier)/
    supplier/
      dashboard/           # Supplier portal dashboard
      surveys/             # Survey submission
      goods/               # Supplier goods management
      profile/             # Supplier profile
```

## 4. Multi-Tenancy

The system implements **row-level multi-tenancy** with tenant isolation enforced at multiple layers.

### Tenant Resolution Flow

```
Request --> NextAuth Session --> tenant.id extracted
                                      |
                          +-----------+-----------+
                          |                       |
                    Prisma Middleware        API Headers
                    (db-tenant.ts)        (X-Tenant-Id)
                          |                       |
                    Auto-filter by          .NET / Python
                    tenantId on             services filter
                    27 scoped models        by tenant
```

### Tenant-Scoped Models (27 models)

All tenant-scoped models include a `tenantId` foreign key that is automatically filtered by Prisma middleware. Key scoped entities include:

- Company, Installation, InstallationData
- Emission (tenant resolved via InstallationData, no direct tenantId)
- AnnualDeclaration, CbamCertificate
- FuelBalance, GhgBalanceByType
- Supplier, SupplierSurvey, SupplierGood
- MonitoringPlan, Report

### Production Tenants

| Tenant | Database Prefix (v1.0) | Description |
|--------|----------------------|-------------|
| ecosfer | SP_ecosfercomtr | Ecosfer primary |
| roder | SP_rodercomtr | Roder operations |
| borubar | SP_borubarcomtr | Borubar operations |

## 5. .NET Document Service

The .NET 9 Document Service handles CPU-intensive document processing tasks. It uses **Minimal API** (no controllers, just endpoint mappings) for a lightweight footprint.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/excel/import | Import CBAM Excel template (5 sheets) |
| POST | /api/xml/generate | Generate CBAM Declaration XML |
| GET | /api/xml/download/{id} | Download generated XML |
| POST | /api/reports/pdf | Generate PDF report |
| GET | /health | Health check |

### Excel Import (EPPlus 7.5.2)

Migrated from v1.0's `CBAMExcelFileViewController.cs` (1,160 lines, 85+ cell mappings).

**5 Sheets Imported:**

1. **A_InstData** - Installation data (general info, production activities)
2. **B_EmInst** - Emission installations
3. **C_Emissions&Energy** - Emissions and energy data
4. **D_Processes** - Process-specific data
5. **E_PurchPrec** - Purchased precursors

**L54/L65/L66 Bug Fix:** In v1.0, three different cells (L54, L65, L66) wrote to the same field. In v2.0, these map to three separate fields: `directEmissions`, `heatEmissions`, and `wasteGasEmissions`.

**Helper Functions:** `SafeParseDecimal`, `ForceParseDecimal`, `SafeGetText` for robust cell value parsing.

### XML Generation (System.Xml.Linq)

Generates CBAM Declaration XML documents with 7 sections. Includes:
- XSD structural validation via `XsdValidatorService`
- Business rule validation and cross-reference checks
- SHA-256 integrity hash computation

### PDF Reports (QuestPDF)

5 report types with TR/EN/DE language support:

1. **Installation Summary** - Overview of installation data
2. **Declaration Report** - Full declaration details
3. **Emission Detail** - Detailed emission breakdown
4. **Supplier Survey** - Supplier emission survey results
5. **Custom Report** - Configurable report template

### Observability

- **Prometheus metrics**: `excel_import_total`, `xml_generation_total`, `pdf_report_total`
- **Structured logging**: Serilog with JSON formatter

### File Structure

```
services/dotnet/
  Services/
    ExcelImportService.cs      # ~550 lines, 5-sheet import
    XmlGeneratorService.cs     # ~350 lines, CBAM XML generation
    XsdValidatorService.cs     # ~170 lines, XML validation
    PdfReportService.cs        # ~600 lines, QuestPDF 5 report types
  Models/
    ImportResult.cs            # Excel import result models
    XmlModels.cs               # XML generation models
    PdfModels.cs               # PDF report models
  Helpers/
    ExcelHelper.cs             # SafeParse, Forceparse, SafeGetText
```

## 6. Python AI Service

The Python AI/ML Service provides intelligent analysis capabilities using FastAPI.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/ai/forecast | Emission forecasting |
| POST | /api/ai/anomalies | Anomaly detection |
| POST | /api/ai/narrative | Report narrative generation |
| GET | /health | Health check |

### Emission Forecasting

- **Primary model**: XGBoost with feature engineering (temporal features, lag values)
- **Fallback model**: LinearRegression (when data is insufficient for XGBoost)
- **Confidence intervals**: Bootstrap method for uncertainty quantification
- **Minimum data**: Works with 3+ historical datapoints

### Anomaly Detection

Hybrid approach combining ML and rule-based methods:

- **IsolationForest**: Unsupervised anomaly detection on emission patterns
- **Balance mismatch**: Detects inconsistencies between fuel and GHG balances
- **Sudden change**: Flags dramatic period-over-period changes
- **Negative values**: Identifies invalid negative emission entries

### Report Narrative Generation

- **Primary**: LangChain integration with Claude or GPT-4 for natural language reports
- **Fallback**: Template-based narrative generation when LLM is unavailable
- **Languages**: TR/EN/DE output support

### Observability

- **Prometheus metrics**: `ai_requests_total`, `ai_forecast_model`, `ai_anomalies_detected`
- **Structured logging**: structlog with JSON renderer

### File Structure

```
services/ai/
  main.py                          # FastAPI endpoints (3 AI + health)
  config.py                        # Configuration (DB, Redis, API keys)
  database.py                      # SQLAlchemy connection, 3 data fetch functions
  services/
    forecast_service.py            # XGBoost/LinearRegression forecasting
    anomaly_service.py             # IsolationForest anomaly detection
    narrative_service.py           # LangChain narrative + template fallback
```

## 7. Data Model

The Prisma schema defines **82 models** covering all aspects of CBAM data management.

### Entity Relationship Overview

```
Tenant (1) ----< (N) Company
                       |
Company (1) ----< (N) Installation
                       |
Installation (1) ----< (N) InstallationData
                             |
              +--------------+------------------+
              |              |                  |
     Emission (N)    FuelBalance (N)    GhgBalanceByType (N)
              |                         GhgBalanceByMonitoringMethodologyType (N)
              |
     InstallationGoodsCategoryAndRoute (N)

Tenant (1) ----< (N) AnnualDeclaration
                       |
              +--------+--------+
              |                 |
    CbamCertificate (N)   ImportedGood (N)
              |
    CertificateSurrender (N)
    FreeAllocationAdjustment (N)

Tenant (1) ----< (N) Supplier
                       |
              +--------+--------+
              |                 |
    SupplierSurvey (N)   SupplierGood (N)
```

### Key Model Groups

| Group | Models | Description |
|-------|--------|-------------|
| **Core** | Company, Installation, InstallationData | Organizational hierarchy |
| **Emissions** | Emission, EmissionSource, EmissionFactor | Carbon emission tracking |
| **Balance** | FuelBalance, GhgBalanceByType, GhgBalanceByMonitoringMethodologyType | Energy and GHG balances |
| **Declaration** | AnnualDeclaration, ImportedGood, DeclarationGoods | Regulatory declarations |
| **Certificate** | CbamCertificate, CertificateSurrender, FreeAllocationAdjustment | CBAM certificates |
| **Supplier** | Supplier, SupplierSurvey, SupplierGood | Supply chain data |
| **Reference** | Country (39), City (30), District (26), CnCode (60+), Unit, EmissionFactor | Seed/reference data |
| **Auth** | User, Role, Session, Tenant | Authentication and authorization |
| **Operational** | MonitoringPlan, AuthorisationApplication, Report | Workflow entities |

### Prisma Relation Naming Conventions

Important naming conventions enforced by Prisma:

- `Company.companyProductionActivities` (not `productionActivities`)
- `Installation.installationDatas` (Prisma auto-pluralizes)
- `InstallationData.installationGoodsCategoryAndRoutes`
- `InstallationData.ghgBalanceByTypes`
- `InstallationData.ghgBalanceByMonitoringMethodologyTypes`

## 8. Security

### Authentication

- **NextAuth.js v5** with credentials provider
- **bcrypt** password hashing (salt rounds: 12)
- **Session-based** authentication with secure HTTP-only cookies
- Supplier portal uses **32-byte hex token** for invitation-based access

### Authorization

6-role hierarchy with granular permissions:

| Role | Access Level |
|------|-------------|
| SystemAdmin | Full system access, tenant management |
| TenantAdmin | Full access within tenant |
| CBAMDeclarant | Declaration management, data entry |
| Operator | Installation and emission data |
| Verifier | Read access, approval authority |
| SupplierUser | Supplier portal only |

### Infrastructure Security

- **Nginx rate limiting**: 30 requests/second for API, 5 requests/second for auth endpoints
- **Security headers**: HSTS, X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy (strict-origin-when-cross-origin), Permissions-Policy
- **Docker**: All containers run as non-root users
- **Redis**: Password-protected connections
- **Tenant isolation**: Data access strictly restricted by tenant at middleware level

## 9. Data Flow

### CBAM Declaration Flow

```
 1. Upload          2. Wizard           3. Generate         4. AI Check
+----------+    +--------------+    +--------------+    +--------------+
| Operator |    | CBAM         |    | System       |    | AI Service   |
| uploads  +--->+ Declarant    +--->+ generates    +--->+ provides     |
| Excel    |    | creates via  |    | XML + PDF    |    | forecasts &  |
| template |    | 7-step       |    | (with XSD    |    | anomaly      |
|          |    | wizard       |    | validation)  |    | detection    |
+----+-----+    +------+-------+    +------+-------+    +------+-------+
     |                 |                   |                    |
     v                 v                   v                    v
+----+-----+    +------+-------+    +------+-------+    +------+-------+
| .NET     |    | Zustand      |    | .NET XML     |    | Python       |
| imports  |    | wizard store |    | generator    |    | XGBoost +    |
| 5 sheets |    | 7 steps:     |    | 7 sections   |    | Isolation    |
| 85+ cell |    | 1.Install    |    | SHA-256 hash |    | Forest       |
| mappings |    | 2.Goods      |    |              |    |              |
|          |    | 3.Emissions  |    | QuestPDF     |    | LangChain    |
|          |    | 4.Certs      |    | 5 report     |    | narrative    |
|          |    | 5.Allocation |    | types        |    | TR/EN/DE     |
|          |    | 6.Verify     |    |              |    |              |
|          |    | 7.Review     |    |              |    |              |
+----------+    +--------------+    +--------------+    +--------------+
                                                               |
                                                               v
                                                    +----------+------+
                                                    | 5. Verifier     |
                                                    | reviews and     |
                                                    | approves        |
                                                    | declaration     |
                                                    +-----------------+
```

### Supplier Survey Flow

```
1. Admin creates       2. Supplier receives      3. Supplier fills     4. Admin reviews
   supplier               invitation email           survey data          in dashboard
+---------------+     +------------------+     +----------------+    +----------------+
| Admin creates |     | System sends     |     | Supplier       |    | Admin views    |
| supplier in   +---->+ 32-byte hex      +---->+ accesses       +--->+ supplier data  |
| dashboard     |     | token invitation |     | portal, fills  |    | badges show    |
| (name, email, |     |                  |     | emission data, |    | survey count,  |
|  country)     |     |                  |     | goods info     |    | goods count    |
+---------------+     +------------------+     +----------------+    +----------------+
```

### Next.js API Proxy Pattern

Frontend communicates with backend services through Next.js API routes that act as proxies:

```
Browser --> Next.js API Route --> Backend Service
                |
                +-- /api/documents/excel/import  --> .NET :5100/api/excel/import
                +-- /api/documents/xml/generate  --> .NET :5100/api/xml/generate
                +-- /api/documents/xml/download   --> .NET :5100/api/xml/download
                +-- /api/documents/reports/pdf   --> .NET :5100/api/reports/pdf
                +-- /api/ai/forecast             --> Python :8000/api/ai/forecast
                +-- /api/ai/anomalies            --> Python :8000/api/ai/anomalies
                +-- /api/ai/narrative            --> Python :8000/api/ai/narrative
```

## 10. Monitoring & Observability

### Prometheus

- **Scrape interval**: 15 seconds
- **5 scrape targets**: Next.js frontend, .NET document service, Python AI service, Nginx, Node Exporter
- **9 alert rules** organized in 4 groups:

| Group | Alerts |
|-------|--------|
| service_health | ServiceDown, HighErrorRate, SlowResponseTime |
| resource_usage | HighCPUUsage, HighMemoryUsage |
| database | DatabaseConnectionPoolExhausted, SlowQueries |
| business_metrics | ExcelImportFailureRate, AIServiceDegradation |

### Grafana

3 auto-provisioned dashboards:

1. **System Overview** - High-level health, request rates, error rates across all services
2. **Service Health** - Per-service detailed metrics, latency percentiles, throughput
3. **Logs** - Integrated Loki log viewer with service-based filtering

### Logging

| Service | Library | Format |
|---------|---------|--------|
| Next.js | Built-in | JSON structured |
| .NET | Serilog | JSON formatter |
| Python | structlog | JSON renderer |

### Log Aggregation

- **Loki**: Centralized log storage with 30-day retention
- **Promtail**: Log shipper collecting from all Docker containers
- **Labels**: service, environment, level for efficient querying

### Frontend Metrics

- **Web Vitals** reporting via `/api/vitals` endpoint
- Tracks LCP, FID, CLS, TTFB, FCP

## 11. Design Decisions

| Decision | Choice | Alternative Considered | Rationale |
|----------|--------|----------------------|-----------|
| **Architecture** | Microservices | Monolith (v1.0) | .NET for CPU-intensive doc processing, Python for ML; independent scaling and deployment |
| **ORM** | Prisma 7 | Raw SQL, TypeORM | Type-safe queries, migration management, handles 82-model schema elegantly |
| **Server-side data** | Server Actions | API Routes | Next.js 16 RSC pattern; colocated with components, automatic serialization |
| **Client state** | Zustand | Redux, Context | Lightweight for wizard state (7 steps), zero boilerplate, great DevTools |
| **Excel parsing** | EPPlus 7.5.2 | NPOI, ClosedXML | Better API ergonomics, direct code migration from v1.0's EPPlus usage |
| **PDF generation** | QuestPDF | iText, PDFSharp | Fluent C# API, open-source friendly license, excellent table support |
| **ML forecasting** | XGBoost | LSTM, Prophet | Works well with small datasets (3+ datapoints), fast training, interpretable |
| **Anomaly detection** | IsolationForest + rules | Autoencoder | Hybrid approach catches both statistical and domain-specific anomalies |
| **i18n** | next-intl v4.8.2 | react-intl, i18next | Native Next.js App Router support, cookie-based locale, simple API |
| **Form validation** | Zod v4 | Yup, Joi | TypeScript-first, integrates with React Hook Form, shared client/server schemas |
| **Tables** | TanStack Table v8 | AG Grid, DataGrid | Headless, composable with shadcn/ui, built-in sort/filter/pagination |
| **Charts** | Recharts 3.x | D3, Chart.js | React-native, declarative API, good TypeScript support |
| **Reverse proxy** | Nginx | Traefik, Caddy | Mature, well-documented, built-in rate limiting and security headers |
| **Database** | PostgreSQL 16 | SQL Server (v1.0) | Open-source, excellent JSON support, Prisma-native, lower cost |
| **Cache** | Redis 7 | Memcached | Pub/sub for future real-time features, data structures, persistence |

## 12. Deployment

### Docker Compose Services

```yaml
services:
  frontend:     # Next.js 16, port 3000
  dotnet:       # .NET 9 Minimal API, port 5100
  ai:           # Python FastAPI, port 8000
  postgres:     # PostgreSQL 16, port 5432
  redis:        # Redis 7, port 6379
  nginx:        # Reverse proxy, port 80
  prometheus:   # Metrics, port 9090
  grafana:      # Dashboards, port 3001
  loki:         # Log aggregation, port 3100
  promtail:     # Log shipping
  node-exporter: # Host metrics, port 9100
```

### Environment Configuration

- `.env` file for local development
- Docker secrets for production credentials
- Prisma connection via `prisma.config.ts` (not in schema file)
- Service discovery via Docker Compose networking (service names as hostnames)

## 13. Migration from v1.0

### What Changed

| Aspect | v1.0 | v2.0 |
|--------|------|------|
| Frontend | Blazor Server | Next.js 16 + React 19 |
| Backend | .NET 8 monolith | .NET 9 + Python microservices |
| ORM | XPO (DevExpress) | Prisma 7.3.0 |
| Database | SQL Server | PostgreSQL 16 |
| UI Framework | DevExpress XAF 23.2.6 | shadcn/ui + Tailwind CSS 4 |
| Excel Import | 1,160-line ViewController | 550-line service (EPPlus) |
| Entities | 84 persistent (XPO) | 82 Prisma models |
| Auth | XAF built-in | NextAuth.js v5 |
| Hosting | IIS / Windows Server | Docker containers |

### What Was Preserved

- All 85+ cell mappings from Excel import
- Business logic for CBAM calculations
- Multi-tenant data isolation pattern
- Entity relationships and data model structure
- Reference data (countries, CN codes, units, emission factors)

### Bugs Fixed

- **L54/L65/L66**: In v1.0, cells L54, L65, and L66 all wrote to the same database field. In v2.0, these map to three separate fields: `directEmissions`, `heatEmissions`, and `wasteGasEmissions`.
