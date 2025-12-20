# Start Metro for testing
# Usage: .\scripts\start-metro.ps1

Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      ULTRAIPTV - Metro Dev Server         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan

Set-Location 'C:\Junior\ultraiptv\mobile'

Write-Host "`n✅ Starting Metro bundler..." -ForegroundColor Green
Write-Host "Press 'a' to open in Android emulator" -ForegroundColor Yellow
Write-Host "Press 'i' for iOS simulator" -ForegroundColor Yellow
Write-Host "Press 'w' for web (http://localhost:8081)" -ForegroundColor Yellow
Write-Host "Press 'Ctrl+C' to stop`n" -ForegroundColor Yellow

pnpm start
