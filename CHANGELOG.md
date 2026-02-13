# Changelog

Ecosfer SKDM v2.0 sürüm geçmişi.

## [2.0.0-rc1] - 2026-02-11

### Faz 4: UAT, Bug Fix & Production Deploy (Hafta 13-15)

#### Hafta 13: Kritik Fix + UAT Test Senaryoları
- **Güvenlik**: Token log temizliği (plaintext token loglama kaldırıldı)
- **CORS**: .NET ve Python servislerinde hardcoded origin -> env var
- **Dashboard**: Gerçek verilerle stat kartları (async Server Component)
- **Email**: Resend SDK ile tedarikçi davet e-postaları (TR/EN/DE)
- **E2E Testler**: 8 yeni test dosyası, ~79 test senaryosu
  - Auth setup (storageState), Company/Installation/Emission CRUD
  - Declaration wizard, Supplier portal, Reports, AI analysis
- Playwright config güncelleme (setup project + dependencies)

#### Hafta 14: Bug Fix & İyileştirme
- **Supplier Survey**: Placeholder -> fonksiyonel admin sayfası
  - DataTable, durum filtreleme, detay dialog, onayla aksiyonu
- **Reports**: Rapor detay görünümü, PDF oluştur butonu, tip seçici
- **Excel Export**: EPPlus ile 5-sheet export (A-E), .NET endpoint, proxy
- **Logger**: Production structured JSON logging (Loki uyumlu)
  - console.error -> logError dönüşümü (tüm server actions & API routes)
- **Python**: print -> structlog dönüşümü (narrative_service.py)
- **Unit testler**: logger, email, dashboard actions testleri

#### Hafta 15: Production Deploy
- **SSL/TLS**: nginx.prod.conf (TLS 1.2/1.3, HSTS, CSP, OCSP stapling)
- **SSL Setup**: Let's Encrypt certbot script
- **DB Backup**: Günlük/haftalık/manuel yedekleme (7+4 retention)
- **DB Restore**: Yedekten geri yükleme scripti
- **DB Migrate**: Production Prisma migrate deploy
- **Env Validation**: Zorunlu var, varsayılan şifre, bağlantı, SSL, disk kontrolü
- **Health Check**: Post-deploy servis doğrulama (tüm endpoint'ler + Docker)
- **CI Pipeline**: E2E job eklendi (PostgreSQL service, Playwright, auth)
- **DEPLOYMENT.md**: Production checklist (pre/deploy/post/rollback)
- **Güvenlik auditi**: Secret tarama, tenant izolasyon, middleware doğrulama

---

## [2.0.0-mvp] - 2026-02-11

### Faz 1: Temel Altyapı ve CRUD (Hafta 1-4)

#### Hafta 1-2: Monorepo ve Auth
- Next.js 16.1.6 + React 19 + TypeScript monorepo kurulumu
- Prisma 7.3.0 ile 82 model PostgreSQL schema
- shadcn/ui + Radix UI + Tailwind CSS 4 UI kit
- Docker Compose development ortamı (PostgreSQL 16 + Redis 7)
- NextAuth.js v5 credentials authentication
- 6 rol ile rol tabanlı erişim kontrolü (RBAC)
- Multi-tenant izolasyon (27 tenant-scoped model)
- Kullanıcı yönetimi (CRUD + şifre değiştirme)
- Zod v4 validasyon şemaları (auth, company, emission, supplier, declaration)

#### Hafta 3: Veri Yönetimi UI
- TanStack Table v8 DataTable (sıralama, filtreleme, sayfalama)
- Company CRUD (şirket yönetimi)
- Installation CRUD (tesis yönetimi)
- InstallationData 5-sekmeli form
- Emission CRUD (SS/PFC/ES koşullu form)
- Server Actions ile veri işlemleri

#### Hafta 4: İleri CRUD ve Seed Data
- Balance CRUD: FuelBalance, GhgBalance
- Report CRUD
- Declaration CRUD (CBAM beyannameleri)
- CbamCertificate, CertificateSurrender (inline düzenleme)
- FreeAllocationAdjustment (inline düzenleme)
- MonitoringPlan, AuthorisationApplication (doğrulama sayfası)
- Kapsamlı seed data: 39 ülke, 30 şehir, 26 ilçe, 60+ CN kodu, birimler, roller

### Faz 2: Servisler ve Entegrasyon (Hafta 5-8)

#### Hafta 5: Excel Import Servisi
- .NET 9 Minimal API + EPPlus 7.5.2
- 5-sheet CBAM şablon import (A_InstData, B_EmInst, C_Emissions&Energy, D_Processes, E_PurchPrec)
- v1.0'dan 85+ hücre eşleşmesi birebir migre edildi
- L54/L65/L66 bug fix (3 ayrı alan: direct/heat/waste)
- SafeParseDecimal/ForceParseDecimal/SafeGetText helper'ları
- Next.js API proxy + ExcelUpload UI bileşeni

#### Hafta 6: XML/PDF ve Beyanname Sihirbazı
- XmlGeneratorService: CBAM Declaration XML (7 bölüm)
- XsdValidatorService: XSD doğrulama + iş kuralı kontrolü
- SHA-256 bütünlük hash
- PdfReportService (QuestPDF): 5 rapor tipi (TR/EN/DE)
- Beyanname Sihirbazı: 7 adımlı wizard (Zustand)
- Next.js API proxy'leri (xml/generate, xml/download, reports/pdf)

#### Hafta 7: i18n ve Tedarikçi Yönetimi
- next-intl v4.8.2: cookie-based locale (TR/EN/DE)
- Supplier Prisma modelleri (email, phone, invitation token)
- Tedarikçi CRUD + davet sistemi (32-byte hex token)
- Tedarikçi Portalı: dashboard, anketler, mallar, profil
- Admin tedarikçi yönetim sayfası

#### Hafta 8: AI/ML Servisi
- Python FastAPI AI servisi (3 endpoint)
- Emisyon Tahmini: XGBoost + LinearRegression fallback
- Anomali Tespiti: IsolationForest + kural tabanlı
- Akıllı Raporlama: LangChain + Claude/GPT-4 + şablon fallback
- SQLAlchemy DB bağlantısı
- AI Dashboard (3 sekmeli): Recharts grafik, tesis seçici
- Tenant ayarları sayfası

### Faz 3: Kalite ve DevOps (Hafta 9-12)

#### Hafta 9: Test Altyapısı
- Frontend: Vitest 4.0.18 + React Testing Library + Playwright + MSW (125 unit + 10 E2E test)
- .NET: xUnit 2.9.3 + FluentAssertions 7.0 + Moq 4.20 (80 test)
- Python: pytest 8.3.4 + pytest-asyncio + pytest-cov (91 test)
- Toplam: 296+ test

#### Hafta 10: CI/CD ve Docker
- GitHub Actions CI: 4 job (frontend, dotnet, python, docker-build)
- GitHub Actions Deploy: GHCR push (tag/manual)
- docker-compose.prod.yml: 6 servis, resource limits
- 3 Dockerfile optimizasyonu: multi-stage, non-root, healthcheck
- Nginx reverse proxy: rate limiting, security headers, gzip
- .dockerignore, .env.example

#### Hafta 11: Monitoring ve Performance
- Prometheus v3.2.1: 5 scrape job, 30 gün retention
- Grafana v11.5.2: 3 auto-provisioned dashboard
- Loki v3.4.2: log aggregation, 30 gün retention
- Promtail v3.4.2: Docker container log shipper
- Node Exporter v1.9.0: host metrikleri
- 9 Prometheus alert kuralı
- .NET: prometheus-net 8.2.1 + Serilog 9.0.0 (JSON structured logging)
- Python: prometheus-client 0.22.0 + structlog 25.1.0
- Next.js: security/cache headers, Web Vitals, /api/health, /api/metrics
- Nginx: JSON log format, Grafana proxy

#### Hafta 12: Dokümantasyon
- README.md: Proje genel bakış, tech stack, hızlı başlangıç
- API.md: Tüm REST endpoint'leri (3 servis)
- DEPLOYMENT.md: Production deployment ve operasyon rehberi
- ARCHITECTURE.md: Sistem mimarisi ve tasarım kararları
- USER_GUIDE.md: Kullanıcı kılavuzu (TR)
- CHANGELOG.md: Sürüm geçmişi

### Teknik İstatistikler

| Metrik | Değer |
|--------|-------|
| Prisma Modeller | 82 |
| Frontend Sayfalar | 25+ |
| Server Actions | 40+ |
| API Endpoint | 30+ |
| Test Sayısı | 390+ |
| TypeScript Hata | 0 |
| Dil Desteği | TR/EN/DE |
| Docker Servis | 11 |
| Grafana Dashboard | 3 |
| Prometheus Alert | 9 |
