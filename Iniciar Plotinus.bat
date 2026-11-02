@echo off
rem Doble clic para abrir el sistema (Windows). Si es la primera vez, tambien lo instala.
chcp 65001 >nul
title Plotinus CRM
cd /d "%~dp0"
call scripts\buscar-node.bat || exit /b 1
node scripts\preparar.mjs iniciar
if errorlevel 1 pause
