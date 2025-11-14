# Script para verificar se Docker Desktop esta rodando

Write-Host "Verificando Docker Desktop..." -ForegroundColor Cyan

# Verificar se Docker esta instalado
$docker = Get-Command docker -ErrorAction SilentlyContinue
if (-not $docker) {
    Write-Host "Docker nao esta instalado!" -ForegroundColor Red
    Write-Host "Instale o Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

Write-Host "Docker esta instalado" -ForegroundColor Green

# Verificar se Docker esta rodando
Write-Host ""
Write-Host "Verificando se Docker Desktop esta rodando..." -ForegroundColor Cyan
$dockerInfo = docker info 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Docker Desktop NAO esta rodando!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Para resolver:" -ForegroundColor Yellow
    Write-Host "1. Abra o Docker Desktop (procure no menu Iniciar)" -ForegroundColor White
    Write-Host "2. Aguarde ate aparecer 'Docker Desktop is running'" -ForegroundColor White
    Write-Host "3. Voce vera o icone da baleia na bandeja do sistema" -ForegroundColor White
    Write-Host "4. Execute este script novamente" -ForegroundColor White
    Write-Host ""
    Write-Host "Dica: Mantenha o Docker Desktop aberto enquanto trabalha no projeto" -ForegroundColor Cyan
    exit 1
}

Write-Host "Docker Desktop esta rodando!" -ForegroundColor Green
Write-Host ""
Write-Host "Agora voce pode executar:" -ForegroundColor Cyan
$cmd = "docker-compose up -d"
Write-Host "   $cmd" -ForegroundColor Gray
