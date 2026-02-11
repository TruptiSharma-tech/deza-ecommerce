@echo off
REM 1. Start React dev server
start "React Server" cmd /k "npm run dev"

REM 2. Wait 3 seconds for React server to start
timeout /t 3

REM 3. Start ngrok (change port 5173 if your Vite dev server is on another port)
start "Ngrok Tunnel" cmd /k "ngrok http 5173"

echo React + Ngrok started!
pause
