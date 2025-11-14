# Script para verificar e iniciar Docker + PostgreSQL

Write-Host "🐳 Verificando Docker Desktop..." -ForegroundColor Cyan

# Verificar se Docker está instalado
$docker = Get-Command docker -ErrorAction SilentlyContinue
if (-not $docker) {
    Write-Host "❌ Docker não encontrado!" -ForegroundColor Red
    Write-Host "💡 Instale o Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Docker encontrado" -ForegroundColor Green

# Verificar se Docker está rodando
Write-Host "`n🔍 Verificando se Docker Desktop está rodando..." -ForegroundColor Cyan
$dockerInfo = docker info 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker Desktop não está rodando!" -ForegroundColor Red
    Write-Host "`n📋 Por favor:" -ForegroundColor Yellow
    Write-Host "1. Abra o Docker Desktop" -ForegroundColor White
    Write-Host "2. Aguarde até aparecer 'Docker Desktop is running'" -ForegroundColor White
    Write-Host "3. Execute este script novamente" -ForegroundColor White
    Write-Host "`n💡 Ou execute manualmente:" -ForegroundColor Yellow
    Write-Host "   docker-compose up -d" -ForegroundColor Gray
    exit 1
}

Write-Host "✅ Docker Desktop está rodando" -ForegroundColor Green

# Verificar se já existe container rodando
Write-Host "`n🔍 Verificando containers existentes..." -ForegroundColor Cyan
$existingContainer = docker ps -a --filter "name=ultraiptv-db" --format "{{.Names}}" 2>&1

if ($existingContainer -eq "ultraiptv-db") {
    $running = docker ps --filter "name=ultraiptv-db" --format "{{.Names}}" 2>&1
    if ($running -eq "ultraiptv-db") {
        Write-Host "✅ Container ultraiptv-db já está rodando" -ForegroundColor Green
        Write-Host "`n📋 Para ver logs: docker-compose logs -f postgres" -ForegroundColor Cyan
        exit 0
    } else {
        Write-Host "🔄 Container existe mas não está rodando. Iniciando..." -ForegroundColor Yellow
        docker start ultraiptv-db 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Container iniciado" -ForegroundColor Green
            exit 0
        }
    }
}

# Voltar para raiz do projeto
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

# Iniciar PostgreSQL
Write-Host "`n🚀 Iniciando PostgreSQL..." -ForegroundColor Cyan
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao iniciar PostgreSQL" -ForegroundColor Red
    exit 1
}

Write-Host "✅ PostgreSQL iniciado!" -ForegroundColor Green

# Aguardar PostgreSQL ficar pronto
Write-Host "`n⏳ Aguardando PostgreSQL ficar pronto..." -ForegroundColor Cyan
$maxAttempts = 30
$attempt = 0
$ready = $false

while ($attempt -lt $maxAttempts -and -not $ready) {
    Start-Sleep -Seconds 2
    $health = docker exec ultraiptv-db pg_isready -U ultraiptv_user -d ultraiptv 2>&1
    if ($LASTEXITCODE -eq 0) {
        $ready = $true
    }
    $attempt++
    Write-Host "." -NoNewline -ForegroundColor Gray
}

Write-Host ""

if ($ready) {
    Write-Host "✅ PostgreSQL está pronto!" -ForegroundColor Green
} else {
    Write-Host "⚠️  PostgreSQL pode não estar totalmente pronto, mas continuando..." -ForegroundColor Yellow
}

Write-Host "`n📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Execute as migrações:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   npm run prisma:generate" -ForegroundColor Gray
Write-Host "   npm run prisma:migrate" -ForegroundColor Gray
Write-Host "`n2. Teste a conexão:" -ForegroundColor White
Write-Host "   npm run test:connection" -ForegroundColor Gray
Write-Host "`n3. Inicie o servidor:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray

