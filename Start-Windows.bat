@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Install Node.js 22 LTS or newer from https://nodejs.org and try again.
 pause
 exit /b 1
)
if not exist node_modules\express (
 call npm ci
 if errorlevel 1 goto fail
)
if not exist dist\index.html (
 call npm run build
 if errorlevel 1 goto fail
)
echo Open http://localhost:4000 after the ready message. Keep this window open.
call npm start
:fail
pause
