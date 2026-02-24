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

echo  [1/4] .env dosyasi hazirlaniyor...

REM ---- .env dosyasi olustur (SQLite) ----
(
echo # Database (SQLite - ek kurulum gerektirmez^)
echo DATABASE_URL="file:./prisma/ecosfer.db"
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

echo         .env dosyasi olusturuldu (SQLite).

REM ---- npm install ----
echo.
echo  [2/4] Bagimliliklar yukleniyor (npm install)...
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
echo  [3/4] Veritabani olusturuluyor (SQLite + Prisma)...
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
echo         82 tablo olusturuldu (SQLite).

REM ---- Seed ----
echo.
echo  [4/4] Test verileri yukleniyor (seed)...
call npm run db:seed
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
echo  Not: Veritabani dosyasi: prisma\ecosfer.db
echo       (PostgreSQL kurulumu gerekmez)
echo.
echo  ══════════════════════════════════════════════════════
echo.
pause
