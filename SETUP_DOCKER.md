# 🐳 Setup com Docker - ULTRAIPTV

Guia rápido para configurar o banco de dados PostgreSQL usando Docker.

## ✅ Pré-requisitos

- Docker Desktop instalado e rodando
- Node.js instalado

## 🚀 Setup Automático (Windows)

```powershell
# Na raiz do projeto
npm run setup:docker
```

Este script vai:
- ✅ Verificar se Docker está instalado
- ✅ Iniciar PostgreSQL em container
- ✅ Criar arquivo .env se não existir
- ✅ Aguardar banco ficar pronto

## 🚀 Setup Manual

### 1. Iniciar PostgreSQL

```bash
docker-compose up -d
```

### 2. Verificar se está rodando

```bash
docker ps
```

Você deve ver o container `ultraiptv-db` rodando.

### 3. Configurar Backend

O arquivo `.env` já foi criado automaticamente. Se não, copie:

```bash
cd backend
cp env.example .env
```

### 4. Executar Migrações

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### 5. Iniciar Backend

```bash
npm run dev
```

## 📋 Comandos Úteis

### Docker

```bash
# Iniciar PostgreSQL
npm run docker:up
# ou
docker-compose up -d

# Parar PostgreSQL
npm run docker:down
# ou
docker-compose down

# Ver logs
npm run docker:logs
# ou
docker-compose logs -f postgres

# Ver status
docker ps

# Acessar banco via psql
docker exec -it ultraiptv-db psql -U ultraiptv_user -d ultraiptv
```

### Backend

```bash
cd backend

# Testar conexão
npm run test:connection

# Gerar Prisma Client
npm run prisma:generate

# Executar migrações
npm run prisma:migrate

# Abrir Prisma Studio
npm run prisma:studio

# Iniciar servidor
npm run dev
```

## 🔧 Configuração do Banco

O Docker está configurado com:

- **Usuário**: `ultraiptv_user`
- **Senha**: `senha123`
- **Banco**: `ultraiptv`
- **Porta**: `5432`

Estas credenciais estão no arquivo `backend/.env`.

## 🐛 Solução de Problemas

### Docker não inicia

```bash
# Verificar se Docker está rodando
docker info

# Reiniciar Docker Desktop
# (Windows: Fechar e abrir Docker Desktop)
```

### Porta 5432 já em uso

Se você já tem PostgreSQL instalado localmente:

1. Pare o serviço local:
   ```powershell
   Stop-Service -Name "postgresql-x64-*"
   ```

2. Ou altere a porta no `docker-compose.yml`:
   ```yaml
   ports:
     - "5433:5432"  # Mude 5432 para 5433
   ```

3. Atualize o `.env`:
   ```env
   DATABASE_URL="postgresql://ultraiptv_user:senha123@localhost:5433/ultraiptv?schema=public"
   ```

### Container não inicia

```bash
# Ver logs
docker-compose logs postgres

# Remover e recriar
docker-compose down -v
docker-compose up -d
```

### Resetar banco de dados

```bash
# Parar e remover volumes
docker-compose down -v

# Recriar
docker-compose up -d

# Executar migrações novamente
cd backend
npm run prisma:migrate
```

## 📝 Próximos Passos

Após configurar o Docker:

1. ✅ Execute as migrações: `npm run prisma:migrate`
2. ✅ Teste a conexão: `npm run test:connection`
3. ✅ Inicie o backend: `npm run dev`
4. ✅ Crie um usuário admin (via painel ou script)

## 💡 Dicas

- O banco de dados persiste em um volume Docker
- Para backup: `docker exec ultraiptv-db pg_dump -U ultraiptv_user ultraiptv > backup.sql`
- Para restore: `docker exec -i ultraiptv-db psql -U ultraiptv_user ultraiptv < backup.sql`

