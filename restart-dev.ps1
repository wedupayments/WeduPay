# Restart Development Server Script
# This script properly restarts the dev server and clears Prisma cache

Write-Host "🔄 Restarting Development Server..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Clear Prisma cache
Write-Host "1️⃣  Clearing Prisma cache..." -ForegroundColor Yellow
if (Test-Path "node_modules\.prisma") {
    Remove-Item -Recurse -Force "node_modules\.prisma" -ErrorAction SilentlyContinue
    Write-Host "   ✓ Prisma cache cleared" -ForegroundColor Green
} else {
    Write-Host "   ℹ No Prisma cache to clear" -ForegroundColor Gray
}

Write-Host ""

# Step 2: Wait for connections to close
Write-Host "2️⃣  Waiting for database connections to close..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Write-Host "   ✓ Connections closed" -ForegroundColor Green

Write-Host ""

# Step 3: Start dev server
Write-Host "3️⃣  Starting development server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   Running: bun dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Start the dev server
bun dev
