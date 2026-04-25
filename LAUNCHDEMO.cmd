@echo off
setlocal

REM One-click local demo launcher for Roufouf (Windows).
REM It starts backend services, ensures a Next.js dev server is running,
REM then opens the public site and Directus admin in the browser.

cd /d "%~dp0"

echo [LAUNCHDEMO] Starting backend services...
docker compose up -d
if errorlevel 1 (
  echo [LAUNCHDEMO] Failed to start Docker services.
  pause
  exit /b 1
)

echo [LAUNCHDEMO] Checking website dev server...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$web3000 = (Test-NetConnection -ComputerName localhost -Port 3000 -WarningAction SilentlyContinue).TcpTestSucceeded; " ^
  "$web3001 = (Test-NetConnection -ComputerName localhost -Port 3001 -WarningAction SilentlyContinue).TcpTestSucceeded; " ^
  "if (-not ($web3000 -or $web3001)) { " ^
  "  Write-Host '[LAUNCHDEMO] Starting pnpm dev in a new window...'; " ^
  "  Start-Process powershell -ArgumentList '-NoExit','-Command','Set-Location ''%~dp0''; pnpm dev'; " ^
  "  Start-Sleep -Seconds 6; " ^
  "}"

echo [LAUNCHDEMO] Opening website and admin interface...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$web3000 = (Test-NetConnection -ComputerName localhost -Port 3000 -WarningAction SilentlyContinue).TcpTestSucceeded; " ^
  "if ($web3000) { Start-Process 'http://localhost:3000/fr' } else { Start-Process 'http://localhost:3001/fr' }; " ^
  "Start-Process 'http://localhost:8055/admin'"

echo [LAUNCHDEMO] Done.
exit /b 0
