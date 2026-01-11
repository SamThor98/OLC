# Start Development Server
# Fix PATH for this session
$env:PATH += ";C:\Program Files\nodejs"

# Change to script directory
Set-Location $PSScriptRoot

# Verify Node.js is available
Write-Host "Starting Old Logan Capital Development Server..." -ForegroundColor Green
Write-Host ""
Write-Host "Node.js version:" -ForegroundColor Yellow
node --version
Write-Host ""
Write-Host "npm version:" -ForegroundColor Yellow
npm --version
Write-Host ""
Write-Host "Starting Vite dev server..." -ForegroundColor Green
Write-Host "Server will be available at: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the dev server
npm run dev
