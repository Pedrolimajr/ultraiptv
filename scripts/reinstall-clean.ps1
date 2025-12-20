# Script de reinstalação limpa com tratamento de permissões
# Use: .\scripts\reinstall-clean.ps1

Write-Host "=== Limpeza e Reinstalação de Dependências ===" -ForegroundColor Cyan

# 1. Fechar processos Node que possam estar bloqueando arquivos
Write-Host "`n[1/5] Encerrando processos Node em execução..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process expo -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 2. Limpar cache npm
Write-Host "[2/5] Limpando cache npm..." -ForegroundColor Yellow
npm cache clean --force

# 3. Remover node_modules e lock files
Write-Host "[3/5] Removendo node_modules e lock files..." -ForegroundColor Yellow
Remove-Item -Recurse -Force "C:\Junior\ultraiptv\node_modules" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "C:\Junior\ultraiptv\mobile\node_modules" -ErrorAction SilentlyContinue
Remove-Item -Force "C:\Junior\ultraiptv\package-lock.json" -ErrorAction SilentlyContinue
Remove-Item -Force "C:\Junior\ultraiptv\mobile\package-lock.json" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:TEMP\npm-*" -ErrorAction SilentlyContinue

# Aguardar liberação de arquivos
Start-Sleep -Seconds 3

# 4. Reinstalar com legacy-peer-deps
Write-Host "[4/5] Reinstalando dependências (isso pode demorar 1-2 minutos)..." -ForegroundColor Yellow
Set-Location "C:\Junior\ultraiptv"
npm install --legacy-peer-deps --verbose

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro na instalação. Tentando novamente com --no-optional..." -ForegroundColor Red
    npm install --legacy-peer-deps --no-optional --verbose
}

# 5. Iniciar Metro
Write-Host "`n[5/5] Iniciando Metro com cache limpo..." -ForegroundColor Yellow
Set-Location "C:\Junior\ultraiptv\mobile"
Write-Host "`nPara parar o Metro, pressione Ctrl+C`n" -ForegroundColor Green
npx expo start -c

Write-Host "Concluído!" -ForegroundColor Green
