@echo off
chcp 65001 >nul 2>&1
title Ecosfer SKDM v2.0 - Uygulama
color 0A

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║   Ecosfer SKDM v2.0 - Uygulama Baslatiliyor         ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
echo  Tarayici otomatik acilacak: http://localhost:3000
echo.
echo  Giris Bilgileri:
echo    E-posta: info@ecosfer.com
echo    Sifre:   Ankara3406.
echo.
echo  Durdurmak icin bu pencereyi kapatin veya Ctrl+C basin.
echo  ──────────────────────────────────────────────────────
echo.

cd /d "%~dp0"

REM node_modules kontrolu
if not exist "node_modules" (
    echo  HATA: Bagimliliklar yuklenmemis!
    echo  Once KURULUM.bat dosyasini calistirin.
    pause
    exit /b 1
)

REM .env kontrolu
if not exist ".env" (
    echo  HATA: .env dosyasi bulunamadi!
    echo  Once KURULUM.bat dosyasini calistirin.
    pause
    exit /b 1
)

REM 2 saniye bekle, sonra tarayici ac
start "" cmd /c "timeout /t 4 /nobreak >nul && start http://localhost:3000"

REM Uygulamayi baslat
call npm run dev
