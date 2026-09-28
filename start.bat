@echo off
setlocal
cd /d "%~dp0"
echo Starting Claude Code Design with Ollama...
echo.
echo Make sure Ollama is installed and running.
echo.
netstat -ano | findstr /c:":4173 " | findstr /c:"LISTENING" >nul
if not errorlevel 1 (
  echo The server is already running.
  start "" http://localhost:4173
  exit /b 0
)
echo Starting the server in its own window. Keep that window open while you use the app.
start "Claude Code Design server" cmd /k npm start
ping -n 6 127.0.0.1 >nul
start "" http://localhost:4173
echo.
echo App opened at http://localhost:4173
echo Close the "Claude Code Design server" window to stop the app.
ping -n 6 127.0.0.1 >nul
