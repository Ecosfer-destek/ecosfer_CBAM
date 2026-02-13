# Ecosfer SKDM v2.0 - REST API Documentation

> **Version:** 2.0.0
> **Last Updated:** 2026-02-11
> **Base URLs:**
> - .NET Document Services: `http://localhost:5100`
> - Python AI Service: `http://localhost:8000`
> - Next.js Frontend: `http://localhost:3000`
> - Production (via nginx): `https://<domain>/api/v1/`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Common Headers](#common-headers)
3. [Error Responses](#error-responses)
4. [Rate Limiting](#rate-limiting)
5. [.NET Document Services](#net-document-services-port-5100)
   - [Health & Metrics](#health--metrics)
   - [Excel Import/Export](#excel-importexport)
   - [XML Generation](#xml-generation)
   - [PDF Reports](#pdf-reports)
6. [Python AI Service](#python-ai-service-port-8000)
   - [Health & Metrics](#health--metrics-1)
   - [Emission Forecast](#emission-forecast)
   - [Anomaly Detection](#anomaly-detection)
   - [AI Narrative Report](#ai-narrative-report)
7. [Next.js Frontend API Routes](#nextjs-frontend-api-routes-port-3000)
   - [Health & Metrics](#health--metrics-2)
   - [Web Vitals](#web-vitals)
   - [Authentication Routes](#authentication-routes)
   - [Tenant & Settings](#tenant--settings)
   - [Document Proxies](#document-proxies)
   - [AI Proxies](#ai-proxies)
   - [Installation Data](#installation-data)
   - [Supplier Portal](#supplier-portal)

---

## Authentication

All protected endpoints require a **Bearer token** obtained via NextAuth.js v5 authentication.

### Obtaining a Token

Authentication is handled by NextAuth.js through the `/api/auth/[...nextauth]` route. After successful login, the session token is returned as an HTTP-only cookie and can also be used as a Bearer token for API calls.

```
Authorization: Bearer <session-token>
```

### Authentication Flow

1. Client sends credentials to `/api/auth/callback/credentials`
2. NextAuth validates against the database (bcrypt-hashed passwords)
3. JWT session token is issued with embedded `tenantId`, `role`, and `userId`
4. Token is sent as a cookie (`next-auth.session-token`) or via `Authorization` header

### Role-Based Access

| Role | Description | Access Level |
|------|-------------|--------------|
| `SYSTEM_ADMIN` | System administrator | Full access to all tenants |
| `TENANT_ADMIN` | Tenant administrator | Full access within own tenant |
| `OPERATOR` | Data operator | Read/write for assigned installations |
| `VIEWER` | Read-only user | Read-only access within tenant |
| `SUPPLIER` | External supplier | Supplier portal only |

---

## Common Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes (protected routes) | `Bearer <token>` |
| `X-Tenant-Id` | Yes (multi-tenant routes) | UUID of the active tenant |
| `Content-Type` | Conditional | `application/json` for JSON bodies, `multipart/form-data` for file uploads |
| `Accept-Language` | Optional | `tr`, `en`, or `de` for localized responses |

### Multi-Tenant Isolation

The `X-Tenant-Id` header is mandatory for all data-access endpoints. The server validates that the authenticated user belongs to the specified tenant. Requests with mismatched tenant IDs return `403 Forbidden`.

```
X-Tenant-Id: 550e8400-e29b-41d4-a716-446655440000
```

---

## Error Responses

All endpoints return errors in a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error description",
    "details": [
      {
        "field": "installationDataId",
        "message": "Required field is missing"
      }
    ],
    "timestamp": "2026-02-11T10:30:00.000Z",
    "requestId": "req_abc123"
  }
}
```

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| `200` | OK | Successful request |
| `201` | Created | Resource successfully created |
| `400` | Bad Request | Invalid input, validation error, malformed JSON |
| `401` | Unauthorized | Missing or expired token |
| `403` | Forbidden | Insufficient permissions or tenant mismatch |
| `404` | Not Found | Resource does not exist |
| `409` | Conflict | Duplicate resource or state conflict |
| `413` | Payload Too Large | File exceeds size limit (max 50MB for Excel) |
| `422` | Unprocessable Entity | Semantically invalid data |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Unexpected server error |
| `502` | Bad Gateway | Upstream service unavailable |
| `503` | Service Unavailable | Service is starting up or under maintenance |

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed (Zod v4) |
| `AUTHENTICATION_ERROR` | Invalid or expired credentials |
| `AUTHORIZATION_ERROR` | Insufficient permissions |
| `TENANT_MISMATCH` | X-Tenant-Id does not match user's tenant |
| `RESOURCE_NOT_FOUND` | Requested entity not found |
| `IMPORT_ERROR` | Excel import processing failed |
| `XML_GENERATION_ERROR` | XML generation or validation failed |
| `PDF_GENERATION_ERROR` | PDF report generation failed |
| `AI_SERVICE_ERROR` | AI service processing failed |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Unexpected server error |

---

## Rate Limiting

Rate limits are enforced per IP address via nginx:

| Zone | Limit | Burst | Applies To |
|------|-------|-------|------------|
| `api` | 30 requests/second | 50 | All `/api/` routes |
| `auth` | 5 requests/second | 10 | `/api/auth/` routes |

### Rate Limit Headers

```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 28
X-RateLimit-Reset: 1707648000
Retry-After: 2
```

When the rate limit is exceeded, the server returns:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 2
Content-Type: application/json

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please retry after 2 seconds."
  }
}
```

---

## .NET Document Services (Port 5100)

Base path: `http://localhost:5100` (direct) or `https://<domain>/api/v1/` (via nginx)

Built with .NET 9 Minimal API, EPPlus 7.5.2, QuestPDF, and System.Xml.Linq.

---

### Health & Metrics

#### `GET /health`

Health check endpoint for the .NET document service. No authentication required.

**Response** `200 OK`

```json
{
  "status": "healthy",
  "service": "ecosfer-skdm-document-service",
  "timestamp": "2026-02-11T10:30:00.000Z",
  "uptime": "2.04:15:30"
}
```

**Example**

```bash
curl http://localhost:5100/health
```

---

#### `GET /metrics`

Prometheus-format metrics endpoint for monitoring and alerting.

**Response** `200 OK` (`text/plain`)

```
# HELP dotnet_requests_total Total HTTP requests
# TYPE dotnet_requests_total counter
dotnet_requests_total{method="POST",endpoint="/api/v1/excel/import",status="200"} 142
dotnet_requests_total{method="POST",endpoint="/api/v1/xml/generate",status="200"} 87

# HELP dotnet_request_duration_seconds Request duration histogram
# TYPE dotnet_request_duration_seconds histogram
dotnet_request_duration_seconds_bucket{le="0.5"} 120
dotnet_request_duration_seconds_bucket{le="1.0"} 135
```

**Example**

```bash
curl http://localhost:5100/metrics
```

---

### Excel Import/Export

#### `POST /api/v1/excel/import`

Import a CBAM Excel file containing up to 5 sheets of installation, emission, and process data. The service parses 85+ cell mappings migrated from v1.0's `CBAMExcelFileViewController.cs`.

**Content-Type:** `multipart/form-data`

**Form Fields**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Excel file (.xlsx), max 50MB |
| `installationDataId` | string (UUID) | Yes | Target InstallationData record |
| `tenantId` | string (UUID) | Yes | Tenant identifier |

**Supported Sheets**

| Sheet Name | Description | Key Data |
|------------|-------------|----------|
| `A_InstData` | Installation master data | Name, address, economic activity, NACE codes |
| `B_EmInst` | Emission installation data | Production processes, goods categories, routes |
| `C_Emissions&Energy` | Emissions and energy data | Direct/indirect emissions, fuel consumption, energy use |
| `D_Processes` | Process emissions | Process-specific emission factors, activity data |
| `E_PurchPrec` | Purchased precursors | Precursor goods, embedded emissions, supplier data |

**Response** `200 OK`

```json
{
  "success": true,
  "installationDataId": "550e8400-e29b-41d4-a716-446655440000",
  "totalRowsProcessed": 156,
  "sheets": [
    {
      "sheetName": "A_InstData",
      "success": true,
      "rowsProcessed": 12,
      "errors": []
    },
    {
      "sheetName": "B_EmInst",
      "success": true,
      "rowsProcessed": 45,
      "errors": []
    },
    {
      "sheetName": "C_Emissions&Energy",
      "success": true,
      "rowsProcessed": 67,
      "errors": []
    },
    {
      "sheetName": "D_Processes",
      "success": true,
      "rowsProcessed": 24,
      "errors": []
    },
    {
      "sheetName": "E_PurchPrec",
      "success": false,
      "rowsProcessed": 8,
      "errors": [
        "Row 15: Invalid decimal value in cell G15",
        "Row 22: Missing required CN code in cell B22"
      ]
    }
  ]
}
```

**Error Responses**

| Status | Condition |
|--------|-----------|
| `400` | Missing required form fields or invalid file format |
| `404` | InstallationData not found |
| `413` | File exceeds 50MB limit |
| `422` | File contains no recognizable sheets |

**Example**

```bash
curl -X POST http://localhost:5100/api/v1/excel/import \
  -H "Authorization: Bearer <token>" \
  -F "file=@cbam_data_2025_q4.xlsx" \
  -F "installationDataId=550e8400-e29b-41d4-a716-446655440000" \
  -F "tenantId=660e8400-e29b-41d4-a716-446655440000"
```

**Notes**
- The L54/L65/L66 bug from v1.0 has been fixed: three separate fields (`directEmissions`, `heatEmissions`, `wasteGasEmissions`) are now mapped correctly instead of writing to the same field.
- Uses `SafeParseDecimal`, `ForceParseDecimal`, and `SafeGetText` helper methods for robust cell parsing.

---

#### `POST /api/v1/excel/import/{sheetName}`

Import a single specific sheet from a CBAM Excel file.

**Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sheetName` | string | Yes | One of: `A_InstData`, `B_EmInst`, `C_Emissions&Energy`, `D_Processes`, `E_PurchPrec` |

**Content-Type:** `multipart/form-data`

**Form Fields**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Excel file (.xlsx), max 50MB |
| `installationDataId` | string (UUID) | Yes | Target InstallationData record |
| `tenantId` | string (UUID) | Yes | Tenant identifier |

**Response** `200 OK`

```json
{
  "success": true,
  "installationDataId": "550e8400-e29b-41d4-a716-446655440000",
  "totalRowsProcessed": 45,
  "sheets": [
    {
      "sheetName": "B_EmInst",
      "success": true,
      "rowsProcessed": 45,
      "errors": []
    }
  ]
}
```

**Example**

```bash
curl -X POST http://localhost:5100/api/v1/excel/import/B_EmInst \
  -H "Authorization: Bearer <token>" \
  -F "file=@cbam_data_2025_q4.xlsx" \
  -F "installationDataId=550e8400-e29b-41d4-a716-446655440000" \
  -F "tenantId=660e8400-e29b-41d4-a716-446655440000"
```

---

#### `GET /api/v1/excel/export/{installationDataId}`

Export installation data as a CBAM-formatted Excel file.

> **Status: Placeholder** - This endpoint is reserved for future implementation.

**Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `installationDataId` | string (UUID) | Yes | InstallationData record to export |

**Response** `501 Not Implemented`

```json
{
  "error": {
    "code": "NOT_IMPLEMENTED",
    "message": "Excel export is not yet available"
  }
}
```

---

### XML Generation

#### `POST /api/v1/xml/generate/{declarationId}`

Generate a CBAM Declaration XML document conforming to the EU CBAM regulation schema. The XML includes 7 sections covering declarant info, imported goods, emissions, carbon price, and verification data.

**Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `declarationId` | string (UUID) | Yes | Declaration record to generate XML for |

**Headers**

| Header | Required | Description |
|--------|----------|-------------|
| `X-Tenant-Id` | Yes | Tenant identifier |

**Response** `200 OK`

```json
{
  "success": true,
  "xmlContent": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<CBAMDeclaration xmlns=\"...\">\n  ...\n</CBAMDeclaration>",
  "hash": "a3f2b8c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1",
  "validationErrors": [],
  "warnings": [
    "Section 4: No carbon price paid data found for goods category 'Cement'"
  ]
}
```

**Response Fields**

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether XML was generated successfully |
| `xmlContent` | string | The complete XML document as a string |
| `hash` | string | SHA-256 integrity hash of the XML content |
| `validationErrors` | string[] | Structural or schema validation errors (empty if valid) |
| `warnings` | string[] | Non-blocking warnings about data quality |

**Validation**
- XSD structural validation against the CBAM schema
- Business rule validation (e.g., emission totals match declared values)
- Cross-reference validation (e.g., goods categories match CN codes)

**Error Responses**

| Status | Condition |
|--------|-----------|
| `400` | Missing X-Tenant-Id header |
| `404` | Declaration not found |
| `422` | Declaration data is incomplete for XML generation |

**Example**

```bash
curl -X POST http://localhost:5100/api/v1/xml/generate/770e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-Id: 660e8400-e29b-41d4-a716-446655440000"
```

---

#### `GET /api/v1/xml/download/{declarationId}`

Download a previously generated CBAM Declaration XML file.

**Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `declarationId` | string (UUID) | Yes | Declaration record |

**Headers**

| Header | Required | Description |
|--------|----------|-------------|
| `X-Tenant-Id` | Yes | Tenant identifier |

**Response** `200 OK` (`application/xml`)

Returns the XML file as a download with the header:
```
Content-Disposition: attachment; filename="CBAM_Declaration_770e8400_2025Q4.xml"
Content-Type: application/xml
```

**Example**

```bash
curl -X GET http://localhost:5100/api/v1/xml/download/770e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-Id: 660e8400-e29b-41d4-a716-446655440000" \
  -o declaration.xml
```

---

### PDF Reports

#### `POST /api/v1/reports/pdf/{reportType}`

Generate a PDF report using QuestPDF. Supports 5 report types with multi-language support (TR/EN/DE).

**Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `reportType` | string | Yes | One of: `installation-summary`, `declaration`, `emission-detail`, `supplier-survey`, `custom` |

**Headers**

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | `application/json` |

**Request Body**

```json
{
  "tenantId": "660e8400-e29b-41d4-a716-446655440000",
  "installationDataId": "550e8400-e29b-41d4-a716-446655440000",
  "declarationId": "770e8400-e29b-41d4-a716-446655440000",
  "language": "tr",
  "title": "Custom Report Title",
  "sections": ["emissions", "energy", "processes"],
  "dateRange": {
    "from": "2025-10-01",
    "to": "2025-12-31"
  }
}
```

**Body Fields**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tenantId` | string (UUID) | Yes | Tenant identifier |
| `installationDataId` | string (UUID) | Conditional | Required for `installation-summary`, `emission-detail` |
| `declarationId` | string (UUID) | Conditional | Required for `declaration` |
| `language` | string | Yes | `"tr"`, `"en"`, or `"de"` |
| `title` | string | No | Custom report title (overrides default) |
| `sections` | string[] | No | Sections to include (for `custom` type) |
| `dateRange` | object | No | Date range filter |

**Report Types**

| Type | Description | Required Fields |
|------|-------------|-----------------|
| `installation-summary` | Comprehensive installation overview with production data, goods categories, and routes | `installationDataId` |
| `declaration` | Full CBAM declaration report with all 7 sections | `declarationId` |
| `emission-detail` | Detailed emission breakdown by source, type, and monitoring methodology | `installationDataId` |
| `supplier-survey` | Supplier survey results and embedded emissions data | `installationDataId` |
| `custom` | Custom report with selectable sections | `installationDataId`, `sections` |

**Response** `200 OK` (`application/pdf`)

Returns the PDF file as a download:
```
Content-Disposition: attachment; filename="Installation_Summary_2025Q4_TR.pdf"
Content-Type: application/pdf
```

**Example**

```bash
curl -X POST http://localhost:5100/api/v1/reports/pdf/installation-summary \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "660e8400-e29b-41d4-a716-446655440000",
    "installationDataId": "550e8400-e29b-41d4-a716-446655440000",
    "language": "en"
  }' \
  -o report.pdf
```

**Example: Declaration Report**

```bash
curl -X POST http://localhost:5100/api/v1/reports/pdf/declaration \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "660e8400-e29b-41d4-a716-446655440000",
    "declarationId": "770e8400-e29b-41d4-a716-446655440000",
    "language": "de"
  }' \
  -o declaration_report_de.pdf
```

---

#### `GET /api/v1/reports/pdf/preview/{reportType}`

Get information about a specific report type including available sections and required fields.

**Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `reportType` | string | Yes | One of: `installation-summary`, `declaration`, `emission-detail`, `supplier-survey`, `custom` |

**Response** `200 OK`

```json
{
  "reportType": "installation-summary",
  "displayName": "Installation Summary Report",
  "description": "Comprehensive overview of installation data including production activities, goods categories, and emission routes.",
  "requiredFields": ["tenantId", "installationDataId", "language"],
  "optionalFields": ["title", "dateRange"],
  "supportedLanguages": ["tr", "en", "de"],
  "availableSections": [
    "general-info",
    "production-activities",
    "goods-categories",
    "emission-routes",
    "monitoring-methodology"
  ]
}
```

**Example**

```bash
curl http://localhost:5100/api/v1/reports/pdf/preview/custom \
  -H "Authorization: Bearer <token>"
```

---

## Python AI Service (Port 8000)

Base path: `http://localhost:8000` (direct) or `https://<domain>/api/v1/` (via nginx)

Built with Python FastAPI, XGBoost, scikit-learn (IsolationForest), LangChain, and SQLAlchemy.

---

### Health & Metrics

#### `GET /health`

Health check endpoint for the Python AI service. No authentication required.

**Response** `200 OK`

```json
{
  "status": "healthy",
  "service": "ecosfer-skdm-ai-service",
  "version": "2.0.0",
  "timestamp": "2026-02-11T10:30:00.000Z"
}
```

**Example**

```bash
curl http://localhost:8000/health
```

---

#### `GET /metrics`

Prometheus-format metrics for the AI service.

**Response** `200 OK` (`text/plain`)

```
# HELP ai_forecast_requests_total Total forecast requests
# TYPE ai_forecast_requests_total counter
ai_forecast_requests_total{status="success"} 234

# HELP ai_anomaly_requests_total Total anomaly detection requests
# TYPE ai_anomaly_requests_total counter
ai_anomaly_requests_total{status="success"} 189

# HELP ai_inference_duration_seconds AI inference duration
# TYPE ai_inference_duration_seconds histogram
ai_inference_duration_seconds_bucket{model="xgboost",le="1.0"} 220
```

**Example**

```bash
curl http://localhost:8000/metrics
```

---

### Emission Forecast

#### `POST /api/v1/forecast/emissions`

Generate emission forecasts using machine learning. The service uses XGBoost as the primary model with LinearRegression as a fallback. Bootstrap confidence intervals are computed for uncertainty quantification.

**Headers**

| Header | Required | Description |
|--------|----------|-------------|
| `X-Tenant-Id` | Yes | Tenant identifier |
| `Content-Type` | Yes | `application/json` |

**Request Body**

```json
{
  "installation_id": "550e8400-e29b-41d4-a716-446655440000",
  "periods": 6
}
```

**Body Fields**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `installation_id` | string (UUID) | Yes | Installation to forecast for |
| `periods` | integer | No | Number of future periods to forecast (1-24, default: 6) |

**Response** `200 OK`

```json
{
  "status": "success",
  "historical": [
    {
      "year": 2023,
      "quarter": "Q1",
      "total_emissions": 15234.56,
      "direct_emissions": 12100.00,
      "indirect_emissions": 3134.56
    },
    {
      "year": 2023,
      "quarter": "Q2",
      "total_emissions": 14890.23,
      "direct_emissions": 11800.00,
      "indirect_emissions": 3090.23
    }
  ],
  "forecast": [
    {
      "year": 2026,
      "quarter": "Q1",
      "predicted": 13500.45,
      "lower_bound": 12150.40,
      "upper_bound": 14850.50
    },
    {
      "year": 2026,
      "quarter": "Q2",
      "predicted": 13200.30,
      "lower_bound": 11880.27,
      "upper_bound": 14520.33
    }
  ],
  "trend": "decreasing",
  "confidence": 0.87,
  "model": "xgboost",
  "r2_score": 0.92
}
```

**Response Fields**

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `"success"` or `"error"` |
| `historical` | array | Historical emission data points |
| `forecast` | array | Predicted future values with confidence bounds |
| `forecast[].predicted` | number | Point estimate (tCO2e) |
| `forecast[].lower_bound` | number | Lower bound of 95% confidence interval |
| `forecast[].upper_bound` | number | Upper bound of 95% confidence interval |
| `trend` | string | Overall trend: `"increasing"`, `"decreasing"`, or `"stable"` |
| `confidence` | number | Model confidence score (0-1) |
| `model` | string | Model used: `"xgboost"` or `"linear_regression"` (fallback) |
| `r2_score` | number | R-squared goodness of fit (0-1) |

**Error Responses**

| Status | Condition |
|--------|-----------|
| `400` | Invalid periods value (must be 1-24) |
| `404` | Installation not found or no historical data |
| `422` | Insufficient historical data for forecasting (minimum 4 data points) |

**Example**

```bash
curl -X POST http://localhost:8000/api/v1/forecast/emissions \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-Id: 660e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "installation_id": "550e8400-e29b-41d4-a716-446655440000",
    "periods": 12
  }'
```

---

### Anomaly Detection

#### `POST /api/v1/analysis/anomalies`

Detect anomalies in emission data using IsolationForest. Checks for balance mismatches, sudden changes, negative values, and statistical outliers.

**Headers**

| Header | Required | Description |
|--------|----------|-------------|
| `X-Tenant-Id` | Yes | Tenant identifier |
| `Content-Type` | Yes | `application/json` |

**Request Body**

```json
{
  "installation_id": "550e8400-e29b-41d4-a716-446655440000",
  "threshold": 0.1
}
```

**Body Fields**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `installation_id` | string (UUID) | Yes | Installation to analyze |
| `threshold` | number | No | Anomaly sensitivity threshold (0.01-0.5, default: 0.1). Lower values detect more anomalies. |

**Response** `200 OK`

```json
{
  "status": "success",
  "anomalies": [
    {
      "type": "balance_mismatch",
      "source": "GHG Balance Q3 2025",
      "severity": "critical",
      "description": "Direct emissions total (15,234 tCO2e) does not match sum of components (14,890 tCO2e). Difference: 344 tCO2e (2.3%)"
    },
    {
      "type": "sudden_change",
      "source": "Fuel Consumption Q2 2025",
      "severity": "warning",
      "description": "Natural gas consumption increased by 45% compared to previous quarter (from 1,200 to 1,740 MWh)"
    },
    {
      "type": "negative_value",
      "source": "Process Emissions Row 12",
      "severity": "critical",
      "description": "Negative emission factor detected: -0.034 tCO2e/t"
    },
    {
      "type": "statistical_outlier",
      "source": "Indirect Emissions Q4 2025",
      "severity": "info",
      "description": "Value 8,450 tCO2e is 2.8 standard deviations above the mean (4,200 tCO2e)"
    }
  ],
  "summary": {
    "total": 4,
    "critical": 2,
    "warning": 1,
    "info": 1,
    "data_quality_score": 0.72
  }
}
```

**Response Fields**

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `"success"` or `"error"` |
| `anomalies` | array | Detected anomalies |
| `anomalies[].type` | string | Anomaly type: `"balance_mismatch"`, `"sudden_change"`, `"negative_value"`, `"statistical_outlier"` |
| `anomalies[].source` | string | Data source where anomaly was found |
| `anomalies[].severity` | string | `"critical"`, `"warning"`, or `"info"` |
| `anomalies[].description` | string | Human-readable description of the anomaly |
| `summary.total` | integer | Total number of anomalies detected |
| `summary.critical` | integer | Number of critical anomalies |
| `summary.warning` | integer | Number of warning-level anomalies |
| `summary.info` | integer | Number of informational anomalies |
| `summary.data_quality_score` | number | Overall data quality score (0-1, where 1 is perfect) |

**Example**

```bash
curl -X POST http://localhost:8000/api/v1/analysis/anomalies \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-Id: 660e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "installation_id": "550e8400-e29b-41d4-a716-446655440000",
    "threshold": 0.05
  }'
```

---

### AI Narrative Report

#### `POST /api/v1/analysis/report-narrative`

Generate an AI-powered narrative report for an installation. Uses LangChain with Claude or GPT-4. Falls back to a template-based generator if LLM is unavailable.

**Headers**

| Header | Required | Description |
|--------|----------|-------------|
| `X-Tenant-Id` | Yes | Tenant identifier |
| `Content-Type` | Yes | `application/json` |

**Request Body**

```json
{
  "installation_id": "550e8400-e29b-41d4-a716-446655440000",
  "report_type": "summary",
  "language": "tr"
}
```

**Body Fields**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `installation_id` | string (UUID) | Yes | Installation to generate report for |
| `report_type` | string | No | `"summary"` (default), `"detailed"`, or `"executive"` |
| `language` | string | No | `"tr"` (default), `"en"`, or `"de"` |

**Report Types**

| Type | Description | Typical Length |
|------|-------------|---------------|
| `summary` | Concise overview of key metrics and trends | 500-800 words |
| `detailed` | Comprehensive analysis with all data points | 1500-2500 words |
| `executive` | High-level summary for management | 300-500 words |

**Response** `200 OK`

```json
{
  "status": "success",
  "narrative": "## Tesis Emisyon Ozet Raporu\n\n### Genel Bakis\nBu rapor, 2025 yili 4. ceyrek donemi icin tesis emisyon verilerini ozetlemektedir...\n\n### Temel Bulgular\n- Toplam dogrudan emisyonlar: 15,234 tCO2e (onceki ceyrege gore %3.2 azalis)\n- Dolayli emisyonlar: 3,134 tCO2e\n- En yuksek emisyon kaynagi: Dogal gaz yanimi (%68)\n\n### Trend Analizi\n...",
  "language": "tr",
  "model": "claude-3-opus"
}
```

**Response Fields**

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `"success"` or `"error"` |
| `narrative` | string | Generated narrative text in Markdown format |
| `language` | string | Language of the generated narrative |
| `model` | string | AI model used (e.g., `"claude-3-opus"`, `"gpt-4"`, `"template-fallback"`) |

**Example**

```bash
curl -X POST http://localhost:8000/api/v1/analysis/report-narrative \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-Id: 660e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "installation_id": "550e8400-e29b-41d4-a716-446655440000",
    "report_type": "executive",
    "language": "en"
  }'
```

---

## Next.js Frontend API Routes (Port 3000)

Base path: `http://localhost:3000`

These routes serve as the frontend's API layer. Document and AI endpoints act as proxies to the .NET and Python services respectively, adding authentication and tenant validation.

---

### Health & Metrics

#### `GET /api/health`

Frontend application health check.

**Response** `200 OK`

```json
{
  "status": "healthy",
  "service": "ecosfer-skdm-frontend",
  "version": "2.0.0",
  "uptime": 345600,
  "environment": "production"
}
```

**Example**

```bash
curl http://localhost:3000/api/health
```

---

#### `GET /api/metrics`

Prometheus-format metrics for the Next.js frontend.

**Response** `200 OK` (`text/plain`)

```
# HELP nextjs_http_requests_total Total HTTP requests
# TYPE nextjs_http_requests_total counter
nextjs_http_requests_total{method="GET",status="200"} 5432

# HELP nextjs_http_errors_total Total HTTP errors
# TYPE nextjs_http_errors_total counter
nextjs_http_errors_total{status="500"} 3

# HELP nodejs_heap_size_total_bytes Total heap size
# TYPE nodejs_heap_size_total_bytes gauge
nodejs_heap_size_total_bytes 125829120
```

**Example**

```bash
curl http://localhost:3000/api/metrics
```

---

### Web Vitals

#### `POST /api/vitals`

Report Web Vitals metrics from the browser client. Used for performance monitoring.

**Request Body**

```json
{
  "name": "LCP",
  "value": 1234.5,
  "rating": "good"
}
```

**Body Fields**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Metric name: `LCP`, `FID`, `CLS`, `TTFB`, `FCP`, `INP` |
| `value` | number | Yes | Metric value in milliseconds (or unitless for CLS) |
| `rating` | string | Yes | `"good"`, `"needs-improvement"`, or `"poor"` |

**Response** `200 OK`

```json
{
  "status": "ok"
}
```

**Example**

```bash
curl -X POST http://localhost:3000/api/vitals \
  -H "Content-Type: application/json" \
  -d '{"name": "LCP", "value": 1234.5, "rating": "good"}'
```

---

#### `GET /api/vitals`

Get a summary of Web Vitals metrics collected in the last 5-minute window.

**Response** `200 OK`

```json
{
  "window": "5m",
  "metrics": {
    "LCP": { "p50": 1200, "p75": 1800, "p95": 2500, "count": 150 },
    "FID": { "p50": 8, "p75": 15, "p95": 45, "count": 150 },
    "CLS": { "p50": 0.05, "p75": 0.1, "p95": 0.25, "count": 150 },
    "TTFB": { "p50": 200, "p75": 400, "p95": 800, "count": 150 },
    "FCP": { "p50": 900, "p75": 1400, "p95": 2000, "count": 150 },
    "INP": { "p50": 50, "p75": 100, "p95": 200, "count": 150 }
  }
}
```

**Example**

```bash
curl http://localhost:3000/api/vitals
```

---

### Authentication Routes

#### `POST /api/auth/[...nextauth]`

NextAuth.js v5 authentication handler. Supports credential-based login with role-based access control and tenant isolation.

**Credential Login**

```bash
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ecosfer.com",
    "password": "securepassword",
    "redirect": false
  }'
```

**Session Check**

```bash
curl http://localhost:3000/api/auth/session \
  -H "Cookie: next-auth.session-token=<token>"
```

**Session Response**

```json
{
  "user": {
    "id": "user-uuid",
    "name": "Admin User",
    "email": "admin@ecosfer.com",
    "role": "TENANT_ADMIN",
    "tenantId": "660e8400-e29b-41d4-a716-446655440000"
  },
  "expires": "2026-03-11T10:30:00.000Z"
}
```

**Sign Out**

```bash
curl -X POST http://localhost:3000/api/auth/signout \
  -H "Cookie: next-auth.session-token=<token>"
```

---

### Tenant & Settings

#### `GET /api/tenants`

Get list of tenants accessible to the current user.

**Response** `200 OK`

```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "name": "Ecosfer",
    "domain": "ecosfer.com",
    "isActive": true
  },
  {
    "id": "770e8400-e29b-41d4-a716-446655440001",
    "name": "Roder",
    "domain": "roder.com",
    "isActive": true
  }
]
```

**Example**

```bash
curl http://localhost:3000/api/tenants \
  -H "Authorization: Bearer <token>"
```

---

#### `GET /api/settings/tenant`

Get tenant-specific settings for the current tenant.

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenantId` | string (UUID) | No | Defaults to user's current tenant |

**Response** `200 OK`

```json
{
  "tenantId": "660e8400-e29b-41d4-a716-446655440000",
  "settings": {
    "companyName": "Ecosfer",
    "defaultLanguage": "tr",
    "dateFormat": "DD.MM.YYYY",
    "decimalSeparator": ",",
    "thousandsSeparator": ".",
    "timezone": "Europe/Istanbul",
    "aiEnabled": true,
    "emailNotifications": true
  }
}
```

**Example**

```bash
curl http://localhost:3000/api/settings/tenant \
  -H "Authorization: Bearer <token>"
```

---

### Document Proxies

These endpoints proxy requests to the .NET Document Service, adding session-based authentication and tenant context.

#### `POST /api/documents/excel/import`

Proxy to `.NET POST /api/v1/excel/import`. Forwards the multipart form data and adds authentication headers.

**Content-Type:** `multipart/form-data`

**Form Fields:** Same as [POST /api/v1/excel/import](#post-apiv1excelimport)

**Example**

```bash
curl -X POST http://localhost:3000/api/documents/excel/import \
  -H "Authorization: Bearer <token>" \
  -F "file=@cbam_data.xlsx" \
  -F "installationDataId=550e8400-e29b-41d4-a716-446655440000" \
  -F "tenantId=660e8400-e29b-41d4-a716-446655440000"
```

---

#### `POST /api/documents/xml/generate/{declarationId}`

Proxy to `.NET POST /api/v1/xml/generate/{declarationId}`. Adds `X-Tenant-Id` from the session.

**Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `declarationId` | string (UUID) | Yes | Declaration to generate XML for |

**Example**

```bash
curl -X POST http://localhost:3000/api/documents/xml/generate/770e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <token>"
```

---

#### `GET /api/documents/xml/download/{declarationId}`

Proxy to `.NET GET /api/v1/xml/download/{declarationId}`. Streams the XML file to the client.

**Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `declarationId` | string (UUID) | Yes | Declaration to download XML for |

**Example**

```bash
curl http://localhost:3000/api/documents/xml/download/770e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <token>" \
  -o declaration.xml
```

---

#### `POST /api/reports/pdf/{reportType}`

Proxy to `.NET POST /api/v1/reports/pdf/{reportType}`. Streams the PDF file to the client.

**Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `reportType` | string | Yes | One of: `installation-summary`, `declaration`, `emission-detail`, `supplier-survey`, `custom` |

**Request Body:** Same as [POST /api/v1/reports/pdf/{reportType}](#post-apiv1reportspdfrepottype)

**Example**

```bash
curl -X POST http://localhost:3000/api/reports/pdf/installation-summary \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "660e8400-e29b-41d4-a716-446655440000",
    "installationDataId": "550e8400-e29b-41d4-a716-446655440000",
    "language": "tr"
  }' \
  -o report.pdf
```

---

### AI Proxies

These endpoints proxy requests to the Python AI Service, adding session-based authentication and tenant context.

#### `POST /api/ai/forecast`

Proxy to `Python POST /api/v1/forecast/emissions`. Adds `X-Tenant-Id` from the session.

**Request Body:** Same as [POST /api/v1/forecast/emissions](#post-apiv1forecastemissions)

**Example**

```bash
curl -X POST http://localhost:3000/api/ai/forecast \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "installation_id": "550e8400-e29b-41d4-a716-446655440000",
    "periods": 6
  }'
```

---

#### `POST /api/ai/anomalies`

Proxy to `Python POST /api/v1/analysis/anomalies`. Adds `X-Tenant-Id` from the session.

**Request Body:** Same as [POST /api/v1/analysis/anomalies](#post-apiv1analysisanomalies)

**Example**

```bash
curl -X POST http://localhost:3000/api/ai/anomalies \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "installation_id": "550e8400-e29b-41d4-a716-446655440000",
    "threshold": 0.1
  }'
```

---

#### `POST /api/ai/narrative`

Proxy to `Python POST /api/v1/analysis/report-narrative`. Adds `X-Tenant-Id` from the session.

**Request Body:** Same as [POST /api/v1/analysis/report-narrative](#post-apiv1analysisreport-narrative)

**Example**

```bash
curl -X POST http://localhost:3000/api/ai/narrative \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "installation_id": "550e8400-e29b-41d4-a716-446655440000",
    "report_type": "summary",
    "language": "tr"
  }'
```

---

### Installation Data

#### `GET /api/installation-data/{id}/goods`

Get goods categories and routes for a specific installation data record. Used by the Declaration Wizard (step 2).

**Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | InstallationData record ID |

**Response** `200 OK`

```json
[
  {
    "id": "good-uuid-1",
    "cnCode": "7207 11 14",
    "cnCodeDescription": "Semi-finished products of iron or non-alloy steel",
    "goodsCategory": "Iron and Steel",
    "productionRoute": "Basic oxygen steelmaking",
    "quantity": 1500.00,
    "unit": "tonnes",
    "specificEmbeddedEmissions": 1.82,
    "totalEmbeddedEmissions": 2730.00
  },
  {
    "id": "good-uuid-2",
    "cnCode": "2523 29 00",
    "cnCodeDescription": "Portland cement",
    "goodsCategory": "Cement",
    "productionRoute": "Grey clinker",
    "quantity": 3200.00,
    "unit": "tonnes",
    "specificEmbeddedEmissions": 0.72,
    "totalEmbeddedEmissions": 2304.00
  }
]
```

**Example**

```bash
curl http://localhost:3000/api/installation-data/550e8400-e29b-41d4-a716-446655440000/goods \
  -H "Authorization: Bearer <token>"
```

---

#### `GET /api/installation-data/{id}/emissions`

Get emission data for a specific installation data record. Used by the Declaration Wizard (step 3).

**Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | InstallationData record ID |

**Response** `200 OK`

```json
[
  {
    "id": "emission-uuid-1",
    "sourceStream": "Natural Gas Combustion",
    "type": "DIRECT",
    "monitoringMethodology": "CALCULATION_BASED",
    "activityData": 5200.00,
    "activityDataUnit": "MWh",
    "emissionFactor": 0.202,
    "emissionFactorUnit": "tCO2/MWh",
    "totalEmissions": 1050.40,
    "oxidationFactor": 1.0,
    "conversionFactor": 1.0
  },
  {
    "id": "emission-uuid-2",
    "sourceStream": "Process Emissions - Calcination",
    "type": "PROCESS",
    "monitoringMethodology": "CALCULATION_BASED",
    "activityData": 8500.00,
    "activityDataUnit": "tonnes",
    "emissionFactor": 0.525,
    "emissionFactorUnit": "tCO2/t",
    "totalEmissions": 4462.50,
    "oxidationFactor": null,
    "conversionFactor": null
  }
]
```

**Example**

```bash
curl http://localhost:3000/api/installation-data/550e8400-e29b-41d4-a716-446655440000/emissions \
  -H "Authorization: Bearer <token>"
```

---

### Supplier Portal

#### `GET /api/supplier/profile`

Get the authenticated supplier's profile information.

**Response** `200 OK`

```json
{
  "id": "supplier-uuid",
  "companyName": "Steel Works GmbH",
  "contactName": "Hans Mueller",
  "email": "hans@steelworks.de",
  "phone": "+49 123 456 7890",
  "country": "Germany",
  "address": "Industriestrasse 42, 40210 Dusseldorf",
  "invitationStatus": "ACCEPTED",
  "invitedAt": "2025-11-15T08:00:00.000Z",
  "acceptedAt": "2025-11-16T10:30:00.000Z",
  "surveysCount": 3,
  "goodsCount": 5
}
```

**Example**

```bash
curl http://localhost:3000/api/supplier/profile \
  -H "Authorization: Bearer <token>"
```

---

#### `PUT /api/supplier/profile`

Update the authenticated supplier's profile information.

**Request Body**

```json
{
  "companyName": "Steel Works GmbH",
  "contactName": "Hans Mueller",
  "email": "hans@steelworks.de",
  "phone": "+49 123 456 7890",
  "country": "Germany",
  "address": "Industriestrasse 42, 40210 Dusseldorf"
}
```

**Body Fields**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `companyName` | string | Yes | Supplier company name |
| `contactName` | string | Yes | Primary contact name |
| `email` | string | Yes | Contact email address |
| `phone` | string | No | Contact phone number |
| `country` | string | No | Country name |
| `address` | string | No | Full address |

**Response** `200 OK`

```json
{
  "id": "supplier-uuid",
  "companyName": "Steel Works GmbH",
  "contactName": "Hans Mueller",
  "email": "hans@steelworks.de",
  "phone": "+49 123 456 7890",
  "country": "Germany",
  "address": "Industriestrasse 42, 40210 Dusseldorf",
  "updatedAt": "2026-02-11T10:30:00.000Z"
}
```

**Example**

```bash
curl -X PUT http://localhost:3000/api/supplier/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Steel Works GmbH",
    "contactName": "Hans Mueller",
    "email": "hans@steelworks.de",
    "phone": "+49 123 456 7890",
    "country": "Germany",
    "address": "Industriestrasse 42, 40210 Dusseldorf"
  }'
```

---

## Appendix: Service Architecture

```
                          +-------------------+
                          |      nginx        |
                          |  (reverse proxy)  |
                          |  Rate limiting    |
                          +--------+----------+
                                   |
                  +----------------+----------------+
                  |                |                 |
          +-------v------+ +------v-------+ +-------v------+
          |  Next.js     | |  .NET 9      | |  Python      |
          |  Frontend    | |  Document    | |  AI Service  |
          |  Port 3000   | |  Services    | |  Port 8000   |
          |              | |  Port 5100   | |              |
          +-------+------+ +------+-------+ +------+-------+
                  |               |                |
                  +-------+-------+--------+-------+
                          |                |
                  +-------v------+  +------v-------+
                  | PostgreSQL   |  |    Redis     |
                  | 16           |  |  (cache &    |
                  | (Prisma 7)   |  |   sessions)  |
                  +--------------+  +--------------+
```

### Service Communication

- **Next.js to .NET:** HTTP proxy via `fetch()` in Next.js API routes
- **Next.js to Python:** HTTP proxy via `fetch()` in Next.js API routes
- **All services to PostgreSQL:** Direct connection (Prisma for Next.js, Npgsql for .NET, SQLAlchemy for Python)
- **All services to Redis:** Direct connection for caching and session management

### Environment Variables

| Variable | Service | Description |
|----------|---------|-------------|
| `DATABASE_URL` | All | PostgreSQL connection string |
| `REDIS_URL` | All | Redis connection string |
| `NEXTAUTH_SECRET` | Next.js | NextAuth JWT signing secret |
| `NEXTAUTH_URL` | Next.js | NextAuth base URL |
| `DOTNET_SERVICE_URL` | Next.js | .NET service base URL (default: `http://localhost:5100`) |
| `AI_SERVICE_URL` | Next.js | Python AI service base URL (default: `http://localhost:8000`) |
| `OPENAI_API_KEY` | Python | OpenAI API key for GPT-4 fallback |
| `ANTHROPIC_API_KEY` | Python | Anthropic API key for Claude |
