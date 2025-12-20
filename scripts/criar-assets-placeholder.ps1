# Script para criar assets placeholder

Write-Host "Criando assets placeholder..." -ForegroundColor Cyan

$assetsPath = "mobile\assets"

# Verificar se pasta existe
if (-not (Test-Path $assetsPath)) {
    New-Item -ItemType Directory -Path $assetsPath -Force | Out-Null
}

# Criar arquivo de instrução
$instructions = @"
# Assets Placeholder

Estes arquivos são placeholders. Para produção, substitua por imagens reais:

- icon.png (1024x1024px) - Ícone do app
- adaptive-icon.png (1024x1024px) - Ícone adaptativo Android
- splash.png (2048x2048px) - Tela de splash
- favicon.png (48x48px) - Favicon

O app funciona sem eles, mas é recomendado adicionar antes do build final.
"@

$instructions | Out-File -FilePath "$assetsPath\README.txt" -Encoding UTF8

Write-Host "Assets placeholder criados!" -ForegroundColor Green
Write-Host ""
Write-Host "Nota: O app funciona sem assets, mas pode dar erro no build." -ForegroundColor Yellow
Write-Host "Recomendado: Adicione as imagens reais antes do build." -ForegroundColor Yellow

