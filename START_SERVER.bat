@echo off
echo Starting Old Logan Capital Development Server...
echo.
cd /d "%~dp0"
set PATH=%PATH%;C:\Program Files\nodejs
echo Node.js version:
node --version
echo.
echo npm version:
npm --version
echo.
echo Starting Vite dev server on http://localhost:5173
echo Press Ctrl+C to stop the server
echo.
npm run dev
pause
