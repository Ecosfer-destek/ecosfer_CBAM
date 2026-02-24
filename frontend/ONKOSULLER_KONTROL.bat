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

echo  [1/1] Node.js kontrol ediliyor...
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
echo  Not: PostgreSQL gerekmez. Veritabani olarak SQLite
echo  kullanilmaktadir (otomatik olusturulur).
echo.
echo  ──────────────────────────────────────────────────────
if %HATA%==1 (
    echo.
    echo  UYARI: Node.js bulunamadi! Yukardaki adresi ziyaret
    echo  edip kurulum yapin, sonra bu kontrolu tekrar calistirin.
    echo.
) else (
    echo.
    echo  BASARILI! Tum onkosullar mevcut.
    echo  Simdi KURULUM.bat dosyasini calistirabilirsiniz.
    echo.
)

pause
