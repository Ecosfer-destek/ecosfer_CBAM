# Ecosfer SKDM v2.0 - Frontend

[Next.js](https://nextjs.org) 16 + React 19 + TypeScript + Prisma 7 + PostgreSQL 16

## Ön Gereksinimler

- **Node.js** v22+ (LTS): https://nodejs.org/en/download
- **Docker Desktop**: https://www.docker.com/products/docker-desktop

## Hızlı Başlangıç

### Windows (Batch dosyaları ile)

1. `ONKOSULLER_KONTROL.bat` - Ön gereksinimleri kontrol edin
2. `KURULUM.bat` - Tek seferlik kurulum (PostgreSQL Docker + npm install + Prisma + seed)
3. `BASLAT.bat` - Uygulamayı başlatın

### Manuel Kurulum

```bash
# 1. PostgreSQL Docker container başlat
docker run -d --name ecosfer-postgres \
  -e POSTGRES_USER=ecosfer \
  -e POSTGRES_PASSWORD=ecosfer_dev_2026 \
  -e POSTGRES_DB=ecosfer_skdm \
  -p 5432:5432 \
  postgres:16-alpine

# 2. Bağımlılıkları yükle
npm install

# 3. .env dosyası oluştur (KURULUM.bat otomatik oluşturur)
# DATABASE_URL="postgresql://ecosfer:ecosfer_dev_2026@localhost:5432/ecosfer_skdm?schema=public"

# 4. Prisma client + veritabanı tablolarını oluştur
npx prisma generate
npx prisma db push

# 5. Seed verileri yükle
npx tsx prisma/seed.ts

# 6. Geliştirme sunucusunu başlat
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini açın.

## Giriş Bilgileri

| E-posta | Şifre | Rol |
|---------|-------|-----|
| info@ecosfer.com | Ankara3406. | SUPER_ADMIN |
| admin@roder.com | Ankara3406. | COMPANY_ADMIN |
| admin@borubar.com | Ankara3406. | COMPANY_ADMIN |

## Teknoloji Altyapısı

| Katman | Teknoloji |
|--------|-----------|
| Framework | Next.js 16.1.6 |
| UI | shadcn/ui + Tailwind CSS 4 |
| ORM | Prisma 7 + PostgreSQL 16 |
| Auth | NextAuth v5 |
| i18n | next-intl (TR/EN/DE) |
| State | Zustand |
| Test | Vitest + Playwright |
