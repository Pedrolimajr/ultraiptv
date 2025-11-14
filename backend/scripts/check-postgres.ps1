# Script PowerShell para verificar PostgreSQL no Windows

Write-Host "🔍 Verificando PostgreSQL..." -ForegroundColor Cyan

# Verificar se PostgreSQL está instalado
$pgPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $pgPath) {
    Write-Host "❌ PostgreSQL não encontrado no PATH" -ForegroundColor Red
    Write-Host "💡 Instale o PostgreSQL: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ PostgreSQL encontrado: $($pgPath.Source)" -ForegroundColor Green

# Verificar serviços PostgreSQL
Write-Host "`n🔍 Verificando serviços PostgreSQL..." -ForegroundColor Cyan
$services = Get-Service | Where-Object { $_.Name -like "*postgresql*" }

if ($services.Count -eq 0) {
    Write-Host "❌ Nenhum serviço PostgreSQL encontrado" -ForegroundColor Red
    Write-Host "💡 Instale o PostgreSQL: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n📋 Serviços encontrados:" -ForegroundColor Cyan
foreach ($service in $services) {
    $status = if ($service.Status -eq "Running") { "✅" } else { "❌" }
    Write-Host "  $status $($service.Name): $($service.Status)" -ForegroundColor $(if ($service.Status -eq "Running") { "Green" } else { "Red" })
}

# Verificar se algum serviço está rodando
$running = $services | Where-Object { $_.Status -eq "Running" }
if ($running.Count -eq 0) {
    Write-Host "`n⚠️  Nenhum serviço PostgreSQL está rodando" -ForegroundColor Yellow
    Write-Host "💡 Para iniciar, execute:" -ForegroundColor Yellow
    Write-Host "   Start-Service -Name '$($services[0].Name)'" -ForegroundColor White
    exit 1
}

# Verificar porta 5432
Write-Host "`n🔍 Verificando porta 5432..." -ForegroundColor Cyan
$port = netstat -ano | findstr :5432
if ($port) {
    Write-Host "✅ Porta 5432 está em uso" -ForegroundColor Green
} else {
    Write-Host "⚠️  Porta 5432 não está em uso" -ForegroundColor Yellow
}

# Tentar conectar
Write-Host "`n🔍 Testando conexão..." -ForegroundColor Cyan
$env:PGPASSWORD = "postgres"  # Senha padrão, pode não funcionar
$result = & psql -U postgres -h localhost -p 5432 -c "SELECT version();" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Conexão bem-sucedida!" -ForegroundColor Green
    Write-Host "`n📝 Próximos passos:" -ForegroundColor Cyan
    Write-Host "1. Crie o banco de dados:" -ForegroundColor White
    Write-Host "   psql -U postgres" -ForegroundColor Gray
    Write-Host "   CREATE DATABASE ultraiptv;" -ForegroundColor Gray
    Write-Host "   CREATE USER ultraiptv_user WITH PASSWORD 'sua_senha';" -ForegroundColor Gray
    Write-Host "   GRANT ALL PRIVILEGES ON DATABASE ultraiptv TO ultraiptv_user;" -ForegroundColor Gray
    Write-Host "`n2. Configure o .env com as credenciais corretas" -ForegroundColor White
    Write-Host "3. Execute: npm run prisma:migrate" -ForegroundColor White
} else {
    Write-Host "❌ Não foi possível conectar" -ForegroundColor Red
    Write-Host "💡 Verifique:" -ForegroundColor Yellow
    Write-Host "   - Usuário e senha corretos" -ForegroundColor White
    Write-Host "   - Banco de dados existe" -ForegroundColor White
    Write-Host "   - Configurações no .env" -ForegroundColor White
}

