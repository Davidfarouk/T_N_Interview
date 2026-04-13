@echo off
setlocal

set PORT=3000

echo Checking for process on port %PORT%...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT% " ^| findstr "LISTENING"') do (
  set PID=%%a
)

if defined PID (
  echo Found process %PID% on port %PORT% -- killing it...
  taskkill /PID %PID% /F
  timeout /t 1 /nobreak >nul
  echo Process killed.
) else (
  echo Port %PORT% is free.
)

echo Starting Tree Nation server...
npm run dev
