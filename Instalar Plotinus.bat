@echo off
rem Doble clic para instalar o actualizar el sistema (Windows).
chcp 65001 >nul
title Instalar Plotinus CRM
cd /d "%~dp0"
call scripts\buscar-node.bat || exit /b 1
node scripts\preparar.mjs instalar
echo.
pause
