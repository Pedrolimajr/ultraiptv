# Script PowerShell para configurar Docker e banco de dados

Write-Host "🐳 Configurando Docker para ULTRAIPTV..." -ForegroundColor Cyan

# Verificar se Docker está instalado
$docker = Get-Command docker -ErrorAction SilentlyContinue
if (-not $docker) {
    Write-Host "❌ Docker não encontrado!" -ForegroundColor Red
    Write-Host "💡 Instale o Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Docker encontrado: $($docker.Version)" -ForegroundColor Green

# Verificar se Docker está rodando
$dockerRunning = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker não está rodando!" -ForegroundColor Red
    Write-Host "💡 Inicie o Docker Desktop e tente novamente" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Docker está rodando" -ForegroundColor Green

# Parar container existente se houver
Write-Host "`n🛑 Parando containers existentes..." -ForegroundColor Cyan
docker-compose down 2>&1 | Out-Null

# Iniciar PostgreSQL
Write-Host "🚀 Iniciando PostgreSQL..." -ForegroundColor Cyan
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao iniciar PostgreSQL" -ForegroundColor Red
    exit 1
}

# Aguardar PostgreSQL ficar pronto
Write-Host "⏳ Aguardando PostgreSQL ficar pronto..." -ForegroundColor Cyan
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

# Verificar se .env existe
$envPath = "backend\.env"
if (-not (Test-Path $envPath)) {
    Write-Host "`n📝 Criando arquivo .env..." -ForegroundColor Cyan
    Copy-Item "backend\env.example" $envPath -ErrorAction SilentlyContinue
    Write-Host "✅ Arquivo .env criado" -ForegroundColor Green
} else {
    Write-Host "`n✅ Arquivo .env já existe" -ForegroundColor Green
}

Write-Host "`n📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Execute as migrações:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   npm run prisma:generate" -ForegroundColor Gray
Write-Host "   npm run prisma:migrate" -ForegroundColor Gray
Write-Host "`n2. Inicie o servidor:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host "`n💡 Para parar o PostgreSQL:" -ForegroundColor Yellow
Write-Host "   docker-compose down" -ForegroundColor Gray

