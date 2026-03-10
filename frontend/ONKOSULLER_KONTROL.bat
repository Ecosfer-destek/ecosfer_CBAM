@echo off
chcp 65001 >nul 2>&1
title Ecosfer SKDM v2.0 - Onkosul Kontrolu
color 0A

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║   Ecosfer SKDM v2.0 - Onkosul Kontrolu             ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

set HATA=0

echo  [1/2] Node.js kontrol ediliyor...
node --version >nul 2>&1
if errorlevel 1 (
    echo         BASARISIZ - Node.js bulunamadi!
    echo         Lutfen yukleyin: https://nodejs.org/en/download
    echo         (LTS surumu secin, v22 veya uzeri)
    set HATA=1
) else (
    for /f "tokens=*" %%v in ('node --version') do echo         TAMAM - Node.js %%v
)

echo.
echo  [2/2] Docker kontrol ediliyor...
docker --version >nul 2>&1
if errorlevel 1 (
    echo         BASARISIZ - Docker bulunamadi!
    echo         Lutfen yukleyin: https://www.docker.com/products/docker-desktop
    set HATA=1
) else (
    for /f "tokens=*" %%v in ('docker --version') do echo         TAMAM - %%v
)

echo.
echo  Not: PostgreSQL, Docker container olarak otomatik kurulacaktir.
echo  Ayrica kurulum yapmaniz gerekmez.
echo.
echo  ──────────────────────────────────────────────────────
if %HATA%==1 (
    echo.
    echo  UYARI: Eksik onkosullar var! Yukardaki adresleri ziyaret
    echo  edip kurulum yapin, sonra bu kontrolu tekrar calistirin.
    echo.
) else (
    echo.
    echo  BASARILI! Tum onkosullar mevcut.
    echo  Simdi KURULUM.bat dosyasini calistirabilirsiniz.
    echo.
)

pause
