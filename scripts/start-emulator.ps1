# Start Android Emulator
# Usage: .\scripts\start-emulator.ps1

Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║    ULTRAIPTV - Android Emulator Launcher  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan

# List available AVDs
$avds = @()
try {
  $emulatorPath = "$env:ANDROID_HOME\emulator\emulator.exe"
  if (Test-Path $emulatorPath) {
    $avdList = & $emulatorPath -list-avds 2>$null
    if ($avdList) {
      $avds = $avdList | Where-Object { $_ }
    }
  }
} catch {
  Write-Host "Could not list AVDs. Trying common path..." -ForegroundColor Yellow
  $emulatorPath = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk\emulator\emulator.exe"
  if (Test-Path $emulatorPath) {
    $avds = & $emulatorPath -list-avds 2>$null | Where-Object { $_ }
  }
}

if ($avds.Count -eq 0) {
  Write-Host "❌ No Android Virtual Devices found." -ForegroundColor Red
  Write-Host "Create one in Android Studio > Device Manager > Create Device" -ForegroundColor Yellow
  exit 1
}

Write-Host "`n📱 Available emulators:" -ForegroundColor Cyan
for ($i = 0; $i -lt $avds.Count; $i++) {
  Write-Host "  $($i+1)) $($avds[$i])"
}

$choice = Read-Host "`nSelect emulator (number)"
$selectedAvd = $avds[$([int]$choice - 1)]

if (-not $selectedAvd) {
  Write-Host "❌ Invalid selection" -ForegroundColor Red
  exit 1
}

Write-Host "`n▶️  Starting: $selectedAvd" -ForegroundColor Green
& $emulatorPath -avd $selectedAvd
