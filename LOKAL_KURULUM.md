# Ecosfer SKDM v2.0 - Lokal Test Ortamı Kurulumu

## Bağlam
Uygulama Ecosfer bünyesinde test edilecek. AI modülü şimdilik devre dışı. Amaç: en minimal kurulumla çalışan bir test ortamı (Frontend + PostgreSQL via Docker). Feedback'lere göre iyileştirmeler yapılacak.

## Ön Gereksinimler
- **Node.js v22+**: https://nodejs.org/en/download (LTS)
- **Docker Desktop**: https://www.docker.com/products/docker-desktop

> **Not:** PostgreSQL ayrıca kurulmasına gerek yok. Docker container olarak otomatik başlatılır.

## Hızlı Kurulum (Batch Dosyaları ile)

1. `frontend/ONKOSULLER_KONTROL.bat` çalıştırın (Node.js + Docker kontrolü)
2. `frontend/KURULUM.bat` çalıştırın (~5 dakika)
   - PostgreSQL Docker container otomatik oluşturulur
   - npm install, Prisma generate, db push, seed otomatik çalışır
3. `frontend/BASLAT.bat` çalıştırın
   - Tarayıcı otomatik açılır: http://localhost:3000

## Manuel Kurulum Adımları

### Adım 1: PostgreSQL Docker Container Başlat

```bash
docker run -d --name ecosfer-postgres \
  -e POSTGRES_USER=ecosfer \
  -e POSTGRES_PASSWORD=ecosfer_dev_2026 \
  -e POSTGRES_DB=ecosfer_skdm \
  -p 5432:5432 \
  postgres:16-alpine
```

### Adım 2: Frontend .env Dosyasını Oluştur/Güncelle
`frontend/.env` dosyası:

```env
# Database (Docker PostgreSQL)
DATABASE_URL="postgresql://ecosfer:ecosfer_dev_2026@localhost:5432/ecosfer_skdm?schema=public"

# Redis - frontend kullanmiyor, bos birakilabilir
REDIS_URL=""

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="ecosfer-skdm-dev-secret-change-in-production-2026"
AUTH_SECRET="ecosfer-skdm-dev-secret-change-in-production-2026"

# .NET ve AI - test ortaminda devre disi
DOTNET_SERVICE_URL=""
AI_SERVICE_URL=""
```

### Adım 3: Bağımlılıkları Yükle
```bash
cd frontend
npm install
```

### Adım 4: Prisma Client + DB Tablolarını Oluştur
```bash
npx prisma generate
npx prisma db push
```

### Adım 5: Seed Data Yükle
```bash
npx tsx prisma/seed.ts
```
Bu komut 12 adımda şunları yükler:
- 3 tenant (Ecosfer, Roder, Borubar)
- Admin kullanıcılar (info@ecosfer.com / Ankara3406.)
- 39+ ülke, 30+ şehir, 26+ ilçe
- 60+ CN kodu, birimler, roller
- Örnek şirket ve tesis verileri

### Adım 6: Uygulamayı Başlat
```bash
npm run dev
```
Tarayıcıda **http://localhost:3000** aç.

### Adım 7: Giriş Yap ve Test Et
- **E-posta:** `info@ecosfer.com`
- **Şifre:** `Ankara3406.`
- Rol: SUPER_ADMIN (tüm sayfalara erişim)

## Çalışacak Özellikler
| Modül | Durum | Not |
|-------|-------|-----|
| Dashboard | ÇALIŞIR | İstatistik kartları, grafikler |
| Şirketler CRUD | ÇALIŞIR | Oluştur, düzenle, sil |
| Tesisler CRUD | ÇALIŞIR | Oluştur, düzenle, sil |
| Tesis Verileri (5 tab) | ÇALIŞIR | A-E sekmeleri, emisyon girişi |
| Emisyonlar CRUD | ÇALIŞIR | SS/PFC/ES formları |
| Beyannameler | ÇALIŞIR | Liste + 7-adım sihirbaz |
| Tedarikçiler + Anket | ÇALIŞIR | CRUD + anket yönetimi |
| Raporlar | ÇALIŞIR | Rapor oluştur/bölüm ekle |
| CBAM Referans Verileri | ÇALIŞIR | 6 sektör referans tabloları |
| Kullanıcı/Rol Yönetimi | ÇALIŞIR | Admin panel |
| i18n (TR/EN/DE) | ÇALIŞIR | Dil değiştirme |
| Excel Import/Export | ÇALIŞMAZ | .NET servisi gerekli |
| PDF Rapor Oluşturma | ÇALIŞMAZ | .NET servisi gerekli |
| XML Export | ÇALIŞMAZ | .NET servisi gerekli |
| AI Analiz/Tahmin | ÇALIŞMAZ | Python servisi + API key gerekli |

## Doğrulama Checklist
1. http://localhost:3000 açılıyor mu?
2. Login başarılı mı? (info@ecosfer.com / Ankara3406.)
3. Dashboard istatistikleri yükleniyor mu?
4. Şirketler listesi veri gösteriyor mu?
5. Yeni şirket oluşturulabiliyor mu?
6. Tesisler ve emisyon formları açılıyor mu?
7. Dil değiştirme (TR/EN/DE) çalışıyor mu?

## Docker Container Yönetimi

```bash
# PostgreSQL container durumu
docker ps -a --filter "name=ecosfer-postgres"

# Container durdurma
docker stop ecosfer-postgres

# Container başlatma
docker start ecosfer-postgres

# Container silme (veri kaybolur)
docker rm -f ecosfer-postgres

# Container logları
docker logs ecosfer-postgres
```

## Sorun Giderme
- **Docker Desktop çalışmıyor:** Docker Desktop uygulamasını açın ve çalışır duruma gelene kadar bekleyin.
- **DB bağlantı hatası:** `docker start ecosfer-postgres` komutu ile container'ın çalıştığından emin olun.
- **Prisma hatası:** `npx prisma generate` tekrar çalıştırın
- **Port çakışması:** 3000 portu başka uygulama kullanıyorsa `npm run dev -- -p 3001`
- **Seed hatası:** DB'yi sıfırlayın: `npx prisma db push --force-reset` sonra tekrar `npx tsx prisma/seed.ts`
- **Port 5432 çakışması:** Yerel PostgreSQL kurulu ve çalışıyorsa durdurun: `services.msc > postgresql-x64-16 > Durdur`
