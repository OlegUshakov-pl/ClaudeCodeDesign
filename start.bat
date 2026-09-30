@echo off
setlocal
cd /d "%~dp0"
if "%PORT%"=="" set PORT=4173
echo Starting Claude Code Design with Ollama...
echo.
echo Make sure Ollama is installed and running.
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20 or newer is required. Install it, then run start.bat again. 1>&2
  exit /b 1
)
netstat -ano | findstr /c:":%PORT% " | findstr /c:"LISTENING" >nul
if not errorlevel 1 (
  echo The server is already running.
  start "" http://localhost:%PORT%
  exit /b 0
)
echo Starting the server in its own window. Keep that window open while you use the app.
start "Claude Code Design server" cmd /k npm start
echo Waiting for http://localhost:%PORT% ...
powershell -NoProfile -Command "$t=0; while ($t -lt 30) { try { $r=Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 http://localhost:$env:PORT/; if ($r.StatusCode -eq 200) { exit 0 } } catch {}; Start-Sleep -Milliseconds 500; $t++ }; exit 1" >nul
if errorlevel 1 (
  echo Server did not become ready on port %PORT%. Check the "Claude Code Design server" window for errors. 1>&2
  exit /b 1
)
start "" http://localhost:%PORT%
echo.
echo App opened at http://localhost:%PORT%
echo Close the "Claude Code Design server" window to stop the app.
