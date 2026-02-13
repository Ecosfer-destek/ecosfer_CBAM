# Ecosfer SKDM Platform v2.0

**Status: Production Ready (RC1)**

CBAM (Carbon Border Adjustment Mechanism) Sustainability Data Management Platform.

EU CBAM regülasyonuna uyum için tasarlanmış, tesis emisyon verisi yönetimi, beyanname oluşturma, tedarikçi yönetimi ve AI destekli analiz platformu.

## Tech Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js 16.1.6, React 19, TypeScript, Tailwind CSS 4, shadcn/ui |
| Auth | NextAuth.js v5, rol tabanlı erişim (6 rol), tenant izolasyonu |
| ORM | Prisma 7.3.0 (82 model), PostgreSQL 16 |
| Doküman Servisleri | .NET 9 Minimal API, EPPlus 7.5.2, QuestPDF, System.Xml.Linq |
| AI Servisi | Python FastAPI, XGBoost, scikit-learn, LangChain |
| Monitoring | Prometheus, Grafana, Loki, Promtail |
| Cache | Redis 7 |
| CI/CD | GitHub Actions, Docker, GHCR |

## Proje Yapısı

```
ecosfer-skdm-v2/
├── frontend/                  # Next.js 16 frontend (Prisma, NextAuth, shadcn/ui)
│   ├── src/
│   │   ├── app/              # App Router sayfaları
│   │   │   ├── (auth)/       # Login/Register
│   │   │   ├── (supplier)/   # Tedarikçi portalı
│   │   │   ├── dashboard/    # Ana panel sayfaları
│   │   │   └── api/          # API route'ları (proxy + health + metrics)
│   │   ├── actions/          # Server Actions (CRUD işlemleri)
│   │   ├── components/       # UI bileşenleri
│   │   ├── lib/              # Auth, DB, validasyonlar, roller
│   │   ├── stores/           # Zustand state management
│   │   └── i18n/             # next-intl (TR/EN/DE)
│   ├── prisma/               # Schema, migrations, seed
│   └── e2e/                  # Playwright E2E testler
├── services/
│   ├── dotnet/               # .NET 9 Minimal API
│   │   ├── Services/         # Excel Import, XML, PDF, XSD
│   │   ├── Metrics/          # Prometheus metrikleri
│   │   ├── Models/           # DTO'lar
│   │   ├── Helpers/          # Excel yardımcı fonksiyonlar
│   │   └── tests/            # xUnit testler
│   └── ai/                   # Python FastAPI AI servisi
│       ├── services/         # Forecast, Anomaly, Narrative
│       ├── metrics.py        # Prometheus metrikleri
│       └── tests/            # pytest testler
├── docker/                   # Monitoring & infra konfigürasyon
│   ├── nginx/                # Reverse proxy (rate limiting, security headers)
│   ├── prometheus/           # Metrik toplama + alert kuralları
│   ├── grafana/              # Dashboard'lar + datasource provisioning
│   ├── loki/                 # Log aggregation
│   └── promtail/             # Container log shipper
├── .github/workflows/        # CI/CD pipeline'ları
├── docker-compose.yml        # Development ortamı
└── docker-compose.prod.yml   # Production ortamı (tüm servisler)
```

## Hızlı Başlangıç

### Gereksinimler

- Node.js 22+
- .NET SDK 9.0
- Python 3.13+
- PostgreSQL 16
- Redis 7
- Docker & Docker Compose

### Development Kurulumu

```bash
# 1. Repo'yu klonla
git clone https://github.com/ecosfer/skdm-v2.git
cd ecosfer-skdm-v2

# 2. Frontend bağımlılıkları
cd frontend
npm install
cp .env.example .env.local   # DB, auth ayarlarını düzenle

# 3. Prisma kurulumu
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts        # Seed data (ülkeler, CN kodları, roller)

# 4. Frontend başlatma
npm run dev                   # http://localhost:3000

# 5. .NET servisi (ayrı terminal)
cd ../services/dotnet
dotnet run                    # http://localhost:5100

# 6. Python AI servisi (ayrı terminal)
cd ../services/ai
pip install -r requirements.txt
uvicorn main:app --reload     # http://localhost:8000
```

### Docker ile Tam Kurulum

```bash
# Production ortamı
cp .env.example .env          # Şifreleri düzenle
docker compose -f docker-compose.prod.yml up -d

# Erişim noktaları:
# - Frontend:    http://localhost
# - Grafana:     http://localhost/grafana/  (admin/ecosfer_grafana_2026)
# - Prometheus:  http://localhost:9090
```

## Testler

```bash
# Frontend (Vitest + 125 test)
cd frontend && npm test

# .NET (xUnit + 80 test)
cd services/dotnet && dotnet test

# Python (pytest + 91 test)
cd services/ai && pytest

# Tümü
npm run test:all
```

## Dokümantasyon

| Doküman | Açıklama |
|---------|----------|
| [API.md](./docs/API.md) | Tüm REST API endpoint'leri |
| [DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Production deployment rehberi |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Sistem mimarisi ve tasarım kararları |
| [USER_GUIDE.md](./docs/USER_GUIDE.md) | Kullanıcı kılavuzu (TR) |
| [CHANGELOG.md](./CHANGELOG.md) | Sürüm geçmişi |

## Roller ve Yetkiler

| Rol | Açıklama |
|-----|----------|
| SUPER_ADMIN | Tam erişim, tenant yönetimi |
| COMPANY_ADMIN | Şirket yönetimi, kullanıcı atama |
| OPERATOR | Tesis verileri, emisyon girişi |
| CBAM_DECLARANT | Beyanname oluşturma/gönderme |
| VERIFIER | Doğrulama işlemleri |
| SUPPLIER | Tedarikçi portalı (sınırlı erişim) |

## Lisans

Proprietary - Ecosfer Sustainability Technologies
