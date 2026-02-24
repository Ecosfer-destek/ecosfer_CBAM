@echo off
chcp 65001 >nul 2>&1
title Ecosfer SKDM v2.0 - Paketleme
color 0E

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║   Ecosfer SKDM v2.0 - Test Paketi Olusturuluyor     ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

set HEDEF=C:\Users\90544\Desktop\Ecosfer_SKDM_Test_Ver2

REM Eski paket varsa sil
if exist "%HEDEF%" (
    echo  Eski paket siliniyor...
    rmdir /s /q "%HEDEF%"
)

echo  [1/2] Dosyalar kopyalaniyor...
echo         (node_modules, test-results, .next haric)
echo         Bu islem 1-2 dakika surebilir...
echo.

robocopy "%~dp0." "%HEDEF%" /E /NFL /NDL /NJH /NJS /nc /ns /np ^
    /XD node_modules .next test-results playwright-report .auth .turbo coverage ^
    /XF *.png *.jpg .DS_Store Thumbs.db

echo.
echo  [2/2] Paket hazirlandi!
echo.
echo  Konum: %HEDEF%
echo  Bu klasoru zip'leyip paylasabilirsiniz.
echo.
echo  Alicinin yapacagi:
echo    1. Zip'i ac
echo    2. ONKOSULLER_KONTROL.bat calistir
echo    3. KURULUM.bat calistir
echo    4. BASLAT.bat calistir
echo.

explorer "%HEDEF%"
pause
