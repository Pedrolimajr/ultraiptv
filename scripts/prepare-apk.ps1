# Script para preparar e gerar APK

Write-Host "Preparando app para gerar APK..." -ForegroundColor Cyan
Write-Host ""

# Verificar se está na pasta mobile
$currentPath = Get-Location
if (-not $currentPath.Path.EndsWith("mobile")) {
    Write-Host "Mudando para pasta mobile..." -ForegroundColor Yellow
    Set-Location mobile
}

# Verificar dependências
Write-Host "1. Verificando dependencias..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
    Write-Host "   Instalando dependencias..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "   Dependencias ja instaladas" -ForegroundColor Green
}

# Verificar EAS CLI
Write-Host ""
Write-Host "2. Verificando EAS CLI..." -ForegroundColor Cyan
$eas = Get-Command eas -ErrorAction SilentlyContinue
if (-not $eas) {
    Write-Host "   EAS CLI nao encontrado!" -ForegroundColor Red
    Write-Host "   Instalando EAS CLI..." -ForegroundColor Yellow
    npm install -g eas-cli
} else {
    Write-Host "   EAS CLI encontrado: $($eas.Version)" -ForegroundColor Green
}

# Verificar login
Write-Host ""
Write-Host "3. Verificando login no Expo..." -ForegroundColor Cyan
$loginCheck = eas whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "   Nao esta logado!" -ForegroundColor Red
    Write-Host "   Execute: eas login" -ForegroundColor Yellow
} else {
    Write-Host "   Logado como: $loginCheck" -ForegroundColor Green
}

# Verificar assets
Write-Host ""
Write-Host "4. Verificando assets..." -ForegroundColor Cyan
$assets = @("icon.png", "adaptive-icon.png", "splash.png")
$missingAssets = @()
foreach ($asset in $assets) {
    if (-not (Test-Path "assets\$asset")) {
        $missingAssets += $asset
    }
}

if ($missingAssets.Count -gt 0) {
    Write-Host "   Assets faltando:" -ForegroundColor Yellow
    foreach ($asset in $missingAssets) {
        Write-Host "     - $asset" -ForegroundColor Gray
    }
    Write-Host "   Nota: App funciona sem eles, mas e recomendado adicionar" -ForegroundColor Cyan
} else {
    Write-Host "   Todos os assets presentes" -ForegroundColor Green
}

# Resumo
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESUMO" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor White
Write-Host "1. Se nao estiver logado: eas login" -ForegroundColor Gray
Write-Host "2. Configurar projeto: eas build:configure" -ForegroundColor Gray
Write-Host "3. Gerar APK: eas build -p android --profile apk" -ForegroundColor Gray
Write-Host ""
Write-Host "Consulte GERAR_APK.md para mais detalhes" -ForegroundColor Cyan

