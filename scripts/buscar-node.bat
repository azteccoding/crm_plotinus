@echo off
rem Lo usan los archivos .bat de Windows. Verifica que Node.js este instalado y sea reciente.
where node >nul 2>nul
if not errorlevel 1 goto revisar_version
if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
where node >nul 2>nul
if not errorlevel 1 goto revisar_version

echo.
echo   ----------------------------------------------------------
echo    Falta instalar Node.js
echo   ----------------------------------------------------------
echo.
echo    1. Entre a https://nodejs.org y descargue la version "LTS".
echo    2. Abra el archivo descargado e instalelo (Siguiente, Siguiente...).
echo    3. Vuelva a hacer doble clic en este archivo.
echo.
start "" "https://nodejs.org/es/download"
pause
exit /b 1

:revisar_version
node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>18||(a===18&&b>=18)?0:1)"
if not errorlevel 1 exit /b 0
echo.
echo   La version de Node.js instalada es muy antigua.
echo   Descargue la version "LTS" en https://nodejs.org, instalela y vuelva a intentar.
echo.
pause
exit /b 1
