# Changelog

Ecosfer SKDM v2.0 surum gecmisi.

## [2.0.0-rc1] - 2026-02-11

### Faz 4: UAT, Bug Fix & Production Deploy (Hafta 13-15)

#### Hafta 13: Kritik Fix + UAT Test Senaryolari
- **Guvenlik**: Token log temizligi (plaintext token loglama kaldirildi)
- **CORS**: .NET ve Python servislerinde hardcoded origin -> env var
- **Dashboard**: Gercek verilerle stat kartlari (async Server Component)
- **Email**: Resend SDK ile tedarikci davet e-postalari (TR/EN/DE)
- **E2E Testler**: 8 yeni test dosyasi, ~79 test senaryosu
  - Auth setup (storageState), Company/Installation/Emission CRUD
  - Declaration wizard, Supplier portal, Reports, AI analysis
- Playwright config guncelleme (setup project + dependencies)

#### Hafta 14: Bug Fix & Iyilestirme
- **Supplier Survey**: Placeholder -> fonksiyonel admin sayfasi
  - DataTable, durum filtreleme, detay dialog, onayla aksiyonu
- **Reports**: Rapor detay gorunumu, PDF olustur butonu, tip secici
- **Excel Export**: EPPlus ile 5-sheet export (A-E), .NET endpoint, proxy
- **Logger**: Production structured JSON logging (Loki uyumlu)
  - console.error -> logError donusumu (tum server actions & API routes)
- **Python**: print -> structlog donusumu (narrative_service.py)
- **Unit testler**: logger, email, dashboard actions testleri

#### Hafta 15: Production Deploy
- **SSL/TLS**: nginx.prod.conf (TLS 1.2/1.3, HSTS, CSP, OCSP stapling)
- **SSL Setup**: Let's Encrypt certbot script
- **DB Backup**: Gunluk/haftalik/manuel yedekleme (7+4 retention)
- **DB Restore**: Yedekten geri yukleme scripti
- **DB Migrate**: Production Prisma migrate deploy
- **Env Validation**: Zorunlu var, varsayilan sifre, baglanti, SSL, disk kontrolu
- **Health Check**: Post-deploy servis dogrulama (tum endpoint'ler + Docker)
- **CI Pipeline**: E2E job eklendi (PostgreSQL service, Playwright, auth)
- **DEPLOYMENT.md**: Production checklist (pre/deploy/post/rollback)
- **Guvenlik auditi**: Secret tarama, tenant izolasyon, middleware dogrulama

---

## [2.0.0-mvp] - 2026-02-11

### Faz 1: Temel Altyapi ve CRUD (Hafta 1-4)

#### Hafta 1-2: Monorepo ve Auth
- Next.js 16.1.6 + React 19 + TypeScript monorepo kurulumu
- Prisma 7.3.0 ile 82 model PostgreSQL schema
- shadcn/ui + Radix UI + Tailwind CSS 4 UI kit
- Docker Compose development ortami (PostgreSQL 16 + Redis 7)
- NextAuth.js v5 credentials authentication
- 6 rol ile rol tabanli erisim kontrolu (RBAC)
- Multi-tenant izolasyon (27 tenant-scoped model)
- Kullanici yonetimi (CRUD + sifre degistirme)
- Zod v4 validasyon semalari (auth, company, emission, supplier, declaration)

#### Hafta 3: Veri Yonetimi UI
- TanStack Table v8 DataTable (siralama, filtreleme, sayfalama)
- Company CRUD (sirket yonetimi)
- Installation CRUD (tesis yonetimi)
- InstallationData 5-sekmeli form
- Emission CRUD (SS/PFC/ES kosullu form)
- Server Actions ile veri islemleri

#### Hafta 4: Ileri CRUD ve Seed Data
- Balance CRUD: FuelBalance, GhgBalance
- Report CRUD
- Declaration CRUD (CBAM beyannameleri)
- CbamCertificate, CertificateSurrender (inline duzenleme)
- FreeAllocationAdjustment (inline duzenleme)
- MonitoringPlan, AuthorisationApplication (dogrulama sayfasi)
- Kapsamli seed data: 39 ulke, 30 sehir, 26 ilce, 60+ CN kodu, birimler, roller

### Faz 2: Servisler ve Entegrasyon (Hafta 5-8)

#### Hafta 5: Excel Import Servisi
- .NET 9 Minimal API + EPPlus 7.5.2
- 5-sheet CBAM sablon import (A_InstData, B_EmInst, C_Emissions&Energy, D_Processes, E_PurchPrec)
- v1.0'dan 85+ hucre eslesmesi birebir migre edildi
- L54/L65/L66 bug fix (3 ayri alan: direct/heat/waste)
- SafeParseDecimal/ForceParseDecimal/SafeGetText helper'lari
- Next.js API proxy + ExcelUpload UI bileseni

#### Hafta 6: XML/PDF ve Beyanname Sihirbazi
- XmlGeneratorService: CBAM Declaration XML (7 bolum)
- XsdValidatorService: XSD dogrulama + is kurali kontrolu
- SHA-256 butunluk hash
- PdfReportService (QuestPDF): 5 rapor tipi (TR/EN/DE)
- Beyanname Sihirbazi: 7 adimli wizard (Zustand)
- Next.js API proxy'leri (xml/generate, xml/download, reports/pdf)

#### Hafta 7: i18n ve Tedarikci Yonetimi
- next-intl v4.8.2: cookie-based locale (TR/EN/DE)
- Supplier Prisma modelleri (email, phone, invitation token)
- Tedarikci CRUD + davet sistemi (32-byte hex token)
- Tedarikci Portali: dashboard, anketler, mallar, profil
- Admin tedarikci yonetim sayfasi

#### Hafta 8: AI/ML Servisi
- Python FastAPI AI servisi (3 endpoint)
- Emisyon Tahmini: XGBoost + LinearRegression fallback
- Anomali Tespiti: IsolationForest + kural tabanli
- Akilli Raporlama: LangChain + Claude/GPT-4 + sablon fallback
- SQLAlchemy DB baglantisi
- AI Dashboard (3 sekmeli): Recharts grafik, tesis secici
- Tenant ayarlari sayfasi

### Faz 3: Kalite ve DevOps (Hafta 9-12)

#### Hafta 9: Test Altyapisi
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
- Prometheus v3.2.1: 5 scrape job, 30 gun retention
- Grafana v11.5.2: 3 auto-provisioned dashboard
- Loki v3.4.2: log aggregation, 30 gun retention
- Promtail v3.4.2: Docker container log shipper
- Node Exporter v1.9.0: host metrikleri
- 9 Prometheus alert kurali
- .NET: prometheus-net 8.2.1 + Serilog 9.0.0 (JSON structured logging)
- Python: prometheus-client 0.22.0 + structlog 25.1.0
- Next.js: security/cache headers, Web Vitals, /api/health, /api/metrics
- Nginx: JSON log format, Grafana proxy

#### Hafta 12: Dokumantasyon
- README.md: Proje genel bakis, tech stack, hizli baslangic
- API.md: Tum REST endpoint'leri (3 servis)
- DEPLOYMENT.md: Production deployment ve operasyon rehberi
- ARCHITECTURE.md: Sistem mimarisi ve tasarim kararlari
- USER_GUIDE.md: Kullanici kilavuzu (TR)
- CHANGELOG.md: Surum gecmisi

### Teknik Istatistikler

| Metrik | Deger |
|--------|-------|
| Prisma Modeller | 82 |
| Frontend Sayfalar | 25+ |
| Server Actions | 40+ |
| API Endpoint | 30+ |
| Test Sayisi | 390+ |
| TypeScript Hata | 0 |
| Dil Destegi | TR/EN/DE |
| Docker Servis | 11 |
| Grafana Dashboard | 3 |
| Prometheus Alert | 9 |
