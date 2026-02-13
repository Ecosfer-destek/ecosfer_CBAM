# Ecosfer SKDM Platform v2.0

**Status: Production Ready (RC1)**

CBAM (Carbon Border Adjustment Mechanism) Sustainability Data Management Platform.

EU CBAM regulasyonuna uyum icin tasarlanmis, tesis emisyon verisi yonetimi, beyanname olusturma, tedarikci yonetimi ve AI destekli analiz platformu.

## Tech Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js 16.1.6, React 19, TypeScript, Tailwind CSS 4, shadcn/ui |
| Auth | NextAuth.js v5, rol tabanli erisim (6 rol), tenant izolasyonu |
| ORM | Prisma 7.3.0 (82 model), PostgreSQL 16 |
| Dokuman Servisleri | .NET 9 Minimal API, EPPlus 7.5.2, QuestPDF, System.Xml.Linq |
| AI Servisi | Python FastAPI, XGBoost, scikit-learn, LangChain |
| Monitoring | Prometheus, Grafana, Loki, Promtail |
| Cache | Redis 7 |
| CI/CD | GitHub Actions, Docker, GHCR |

## Proje Yapisi

```
ecosfer-skdm-v2/
├── frontend/                  # Next.js 16 frontend (Prisma, NextAuth, shadcn/ui)
│   ├── src/
│   │   ├── app/              # App Router sayfalari
│   │   │   ├── (auth)/       # Login/Register
│   │   │   ├── (supplier)/   # Tedarikci portali
│   │   │   ├── dashboard/    # Ana panel sayfalari
│   │   │   └── api/          # API route'lari (proxy + health + metrics)
│   │   ├── actions/          # Server Actions (CRUD islemleri)
│   │   ├── components/       # UI bilesenleri
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
│   │   ├── Helpers/          # Excel yardimci fonksiyonlar
│   │   └── tests/            # xUnit testler
│   └── ai/                   # Python FastAPI AI servisi
│       ├── services/         # Forecast, Anomaly, Narrative
│       ├── metrics.py        # Prometheus metrikleri
│       └── tests/            # pytest testler
├── docker/                   # Monitoring & infra konfigurasyon
│   ├── nginx/                # Reverse proxy (rate limiting, security headers)
│   ├── prometheus/           # Metrik toplama + alert kurallari
│   ├── grafana/              # Dashboard'lar + datasource provisioning
│   ├── loki/                 # Log aggregation
│   └── promtail/             # Container log shipper
├── .github/workflows/        # CI/CD pipeline'lari
├── docker-compose.yml        # Development ortami
└── docker-compose.prod.yml   # Production ortami (tum servisler)
```

## Hizli Baslangic

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

# 2. Frontend bagimliliklari
cd frontend
npm install
cp .env.example .env.local   # DB, auth ayarlarini duzenle

# 3. Prisma kurulumu
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts        # Seed data (ulkeler, CN kodlari, roller)

# 4. Frontend baslatma
npm run dev                   # http://localhost:3000

# 5. .NET servisi (ayri terminal)
cd ../services/dotnet
dotnet run                    # http://localhost:5100

# 6. Python AI servisi (ayri terminal)
cd ../services/ai
pip install -r requirements.txt
uvicorn main:app --reload     # http://localhost:8000
```

### Docker ile Tam Kurulum

```bash
# Production ortami
cp .env.example .env          # Sifreleri duzenle
docker compose -f docker-compose.prod.yml up -d

# Erisim noktalari:
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

# Tumu
npm run test:all
```

## Dokumantasyon

| Dokuman | Aciklama |
|---------|----------|
| [API.md](./docs/API.md) | Tum REST API endpoint'leri |
| [DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Production deployment rehberi |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Sistem mimarisi ve tasarim kararlari |
| [USER_GUIDE.md](./docs/USER_GUIDE.md) | Kullanici kilavuzu (TR) |
| [CHANGELOG.md](./CHANGELOG.md) | Surum gecmisi |

## Roller ve Yetkiler

| Rol | Aciklama |
|-----|----------|
| SUPER_ADMIN | Tam erisim, tenant yonetimi |
| COMPANY_ADMIN | Sirket yonetimi, kullanici atama |
| OPERATOR | Tesis verileri, emisyon girisi |
| CBAM_DECLARANT | Beyanname olusturma/gonderme |
| VERIFIER | Dogrulama islemleri |
| SUPPLIER | Tedarikci portali (sinirli erisim) |

## Lisans

Proprietary - Ecosfer Sustainability Technologies
