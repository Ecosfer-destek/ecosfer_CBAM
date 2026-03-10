@echo off
chcp 65001 >nul 2>&1
title Ecosfer SKDM v2.0 - Kurulum
color 0B

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║   Ecosfer SKDM v2.0 - Tek Seferlik Kurulum          ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

REM ---- Node.js kontrolu ----
node --version >nul 2>&1
if errorlevel 1 (
    echo  HATA: Node.js bulunamadi! Once ONKOSULLER_KONTROL.bat calistirin.
    pause
    exit /b 1
)

REM ---- Docker kontrolu ----
docker --version >nul 2>&1
if errorlevel 1 (
    echo  HATA: Docker bulunamadi! Docker Desktop kurun:
    echo  https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo  [1/5] PostgreSQL container baslatiliyor (Docker)...

REM ---- PostgreSQL container kontrol ve baslat ----
REM Oncelikle mevcut ecosfer-db container'i kontrol et
docker ps -a --filter "name=ecosfer-db" --format "{{.Names}}" 2>nul | findstr /C:"ecosfer-db" >nul 2>&1
if not errorlevel 1 (
    echo         Mevcut PostgreSQL container bulundu (ecosfer-db).
    docker start ecosfer-db >nul 2>&1
    echo         PostgreSQL container baslatildi.
    timeout /t 3 /nobreak >nul
    goto :pg_ready
)

REM ecosfer-postgres container'i kontrol et
docker ps -a --filter "name=ecosfer-postgres" --format "{{.Names}}" 2>nul | findstr /C:"ecosfer-postgres" >nul 2>&1
if not errorlevel 1 (
    echo         Mevcut PostgreSQL container bulundu (ecosfer-postgres).
    docker start ecosfer-postgres >nul 2>&1
    echo         PostgreSQL container baslatildi.
    timeout /t 3 /nobreak >nul
    goto :pg_ready
)

REM Hicbiri yoksa yeni olustur
echo         Yeni PostgreSQL container olusturuluyor...
docker run -d --name ecosfer-postgres ^
    -e POSTGRES_USER=ecosfer ^
    -e POSTGRES_PASSWORD=ecosfer_dev_2026 ^
    -e POSTGRES_DB=ecosfer_skdm ^
    -p 5432:5432 ^
    postgres:16-alpine
if errorlevel 1 (
    echo  HATA: PostgreSQL container olusturulamadi!
    echo  Docker Desktop'in calistigindan emin olun.
    pause
    exit /b 1
)
echo         PostgreSQL container olusturuldu.
echo         Veritabaninin hazir olmasini bekleniyor (10 sn)...
timeout /t 10 /nobreak >nul

:pg_ready

echo  [2/5] .env dosyasi hazirlaniyor...

REM ---- .env dosyasi olustur (PostgreSQL) ----
(
echo # Database (Docker PostgreSQL^)
echo DATABASE_URL="postgresql://ecosfer:ecosfer_dev_2026@localhost:5432/ecosfer_skdm?schema=public"
echo.
echo # Redis - frontend kullanmiyor, bos birakilabilir
echo REDIS_URL=""
echo.
echo # NextAuth
echo NEXTAUTH_URL="http://localhost:3000"
echo NEXTAUTH_SECRET="ecosfer-skdm-dev-secret-change-in-production-2026"
echo AUTH_SECRET="ecosfer-skdm-dev-secret-change-in-production-2026"
echo.
echo # .NET ve AI - test ortaminda devre disi
echo DOTNET_SERVICE_URL=""
echo AI_SERVICE_URL=""
) > "%~dp0.env"

echo         .env dosyasi olusturuldu (PostgreSQL).

REM ---- npm install ----
echo.
echo  [3/5] Bagimliliklar yukleniyor (npm install)...
echo         Bu islem 2-5 dakika surebilir, lutfen bekleyin...
cd /d "%~dp0"
call npm install
if errorlevel 1 (
    echo  HATA: npm install basarisiz!
    pause
    exit /b 1
)
echo         Bagimliliklar yuklendi.

REM ---- Prisma ----
echo.
echo  [4/5] Veritabani tablolari olusturuluyor (PostgreSQL + Prisma)...
call npx prisma generate
if errorlevel 1 (
    echo  HATA: prisma generate basarisiz!
    pause
    exit /b 1
)
call npx prisma db push
if errorlevel 1 (
    echo  HATA: prisma db push basarisiz!
    pause
    exit /b 1
)
echo         82 tablo olusturuldu (PostgreSQL).

REM ---- Seed ----
echo.
echo  [5/5] Test verileri yukleniyor (seed)...
call npx tsx prisma/seed.ts
if errorlevel 1 (
    echo  UYARI: Seed basarisiz olabilir. Devam ediliyor...
)

echo.
echo  ══════════════════════════════════════════════════════
echo.
echo  KURULUM TAMAMLANDI!
echo.
echo  Simdi BASLAT.bat dosyasini calistirarak uygulamayi
echo  baslatabilirsiniz.
echo.
echo  Giris Bilgileri:
echo    E-posta: info@ecosfer.com
echo    Sifre:   Ankara3406.
echo.
echo  Not: PostgreSQL Docker container olarak calismaktadir.
echo       Container adi: ecosfer-postgres
echo       Baglanti: localhost:5432
echo.
echo  ══════════════════════════════════════════════════════
echo.
pause
