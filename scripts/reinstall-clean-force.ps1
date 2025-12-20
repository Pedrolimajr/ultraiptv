<#
  reinstall-clean-force.ps1
  Uso (execute como Administrador):
  PowerShell -ExecutionPolicy Bypass -File .\scripts\reinstall-clean-force.ps1

  Este script tenta lidar com erros comuns no Windows durante `npm install`:
  - encerra processos que podem manter arquivos abertos (Code, node, expo)
  - limpa cache npm, remove node_modules e package-lock.json
  - tenta reinstalar dependências com flags que reduzem a chance de erros
#>

Write-Host "=== Reinstall Clean Force ===" -ForegroundColor Cyan

function Try-StopProcess([string]$name) {
  Write-Host "Stopping process: $name" -ForegroundColor Yellow
  Get-Process -Name $name -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}

Try-StopProcess "node"
Try-StopProcess "expo"
Try-StopProcess "Code"    # VSCode
Try-StopProcess "Code - Insiders" -ErrorAction SilentlyContinue

Start-Sleep -Seconds 2

Write-Host "Killing lingering npm/msbuild/gradle watchers (if any)..." -ForegroundColor Yellow
Get-Process -Name "watchman*" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Cleaning npm cache (force)..." -ForegroundColor Yellow
npm cache clean --force

Write-Host "Removing node_modules and lockfiles (root and mobile)..." -ForegroundColor Yellow
$pathsToRemove = @("C:\Junior\ultraiptv\node_modules", "C:\Junior\ultraiptv\mobile\node_modules", "C:\Junior\ultraiptv\package-lock.json", "C:\Junior\ultraiptv\mobile\package-lock.json")
foreach ($p in $pathsToRemove) {
  if (Test-Path $p) {
    try {
      Remove-Item -Recurse -Force $p -ErrorAction Stop
      Write-Host "Removed: $p" -ForegroundColor Green
    } catch {
      $msg = $_.Exception.Message -replace "\r|\n", ' '
      Write-Host ("Could not remove {0}: {1}" -f $p, $msg) -ForegroundColor Red
    }
  }
}

Start-Sleep -Seconds 2

Write-Host "Attempting reinstall in the repository root (this will produce verbose logs)..." -ForegroundColor Yellow
Set-Location "C:\Junior\ultraiptv"

# Reduce concurrency by limiting npm sockets (helps EMFILE)
$env:NPM_CONFIG_MAX_SOCKETS = '1'

# First attempt: install root (workspaces) with legacy peer deps
Write-Host "Running: npm install --legacy-peer-deps --no-audit --no-fund" -ForegroundColor Cyan
npm install --legacy-peer-deps --no-audit --no-fund --loglevel=verbose 2>&1 | Tee-Object .\scripts\npm-install-root.log

if ($LASTEXITCODE -ne 0) {
  Write-Host "Root install failed, attempting isolated install in mobile folder..." -ForegroundColor Yellow
  Set-Location "C:\Junior\ultraiptv\mobile"
  Write-Host "Running: npm install --legacy-peer-deps --no-audit --no-fund" -ForegroundColor Cyan
  npm install --legacy-peer-deps --no-audit --no-fund --loglevel=verbose 2>&1 | Tee-Object ..\scripts\npm-install-mobile.log
}

Write-Host "If install failed with 'too many open files' (EMFILE), try the following:
- Close VSCode and any editors
- Temporarily disable antivirus (Windows Defender) or add an exclusion for the project folder
- Run this script as Administrator
- Alternatively try using 'pnpm install' (requires pnpm installed)" -ForegroundColor Yellow

Write-Host "Done. Logs: .\scripts\npm-install-root.log and .\scripts\npm-install-mobile.log" -ForegroundColor Green
