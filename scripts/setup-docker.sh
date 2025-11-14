#!/bin/bash

echo "🐳 Configurando Docker para ULTRAIPTV..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado!"
    echo "💡 Instale o Docker: https://www.docker.com/get-started"
    exit 1
fi

echo "✅ Docker encontrado: $(docker --version)"

# Verificar se Docker está rodando
if ! docker info &> /dev/null; then
    echo "❌ Docker não está rodando!"
    echo "💡 Inicie o Docker e tente novamente"
    exit 1
fi

echo "✅ Docker está rodando"

# Parar container existente se houver
echo ""
echo "🛑 Parando containers existentes..."
docker-compose down 2>/dev/null

# Iniciar PostgreSQL
echo "🚀 Iniciando PostgreSQL..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ Erro ao iniciar PostgreSQL"
    exit 1
fi

# Aguardar PostgreSQL ficar pronto
echo "⏳ Aguardando PostgreSQL ficar pronto..."
max_attempts=30
attempt=0
ready=false

while [ $attempt -lt $max_attempts ] && [ "$ready" = false ]; do
    sleep 2
    if docker exec ultraiptv-db pg_isready -U ultraiptv_user -d ultraiptv &> /dev/null; then
        ready=true
    fi
    attempt=$((attempt + 1))
    echo -n "."
done

echo ""

if [ "$ready" = true ]; then
    echo "✅ PostgreSQL está pronto!"
else
    echo "⚠️  PostgreSQL pode não estar totalmente pronto, mas continuando..."
fi

# Verificar se .env existe
if [ ! -f "backend/.env" ]; then
    echo ""
    echo "📝 Criando arquivo .env..."
    cp backend/env.example backend/.env 2>/dev/null || true
    echo "✅ Arquivo .env criado"
else
    echo ""
    echo "✅ Arquivo .env já existe"
fi

echo ""
echo "📋 Próximos passos:"
echo "1. Execute as migrações:"
echo "   cd backend"
echo "   npm run prisma:generate"
echo "   npm run prisma:migrate"
echo ""
echo "2. Inicie o servidor:"
echo "   npm run dev"
echo ""
echo "💡 Para parar o PostgreSQL:"
echo "   docker-compose down"

