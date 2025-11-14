# 📋 Comandos Corretos - ULTRAIPTV

## ⚠️ IMPORTANTE: Onde Executar Cada Comando

### 🐳 Docker (Raiz do Projeto)

**Localização**: `C:\Junior\ultraiptv`

```powershell
# Verificar se Docker está rodando
docker info

# Iniciar PostgreSQL
docker-compose up -d

# Ver containers rodando
docker ps

# Ver logs
docker-compose logs -f postgres

# Parar PostgreSQL
docker-compose down
```

### 🔧 Backend (Pasta backend)

**Localização**: `C:\Junior\ultraiptv\backend`

```powershell
# Gerar Prisma Client
npm run prisma:generate

# Executar migrações
npm run prisma:migrate

# Testar conexão
npm run test:connection

# Iniciar servidor
npm run dev
```

### 🎨 Admin (Pasta admin)

**Localização**: `C:\Junior\ultraiptv\admin`

```powershell
# Iniciar painel admin
npm run dev
```

### 📱 Mobile (Pasta mobile)

**Localização**: `C:\Junior\ultraiptv\mobile`

```powershell
# Iniciar app
npm start
```

## 🚀 Sequência Completa de Início

### 1. Verificar Docker (Raiz)

```powershell
cd C:\Junior\ultraiptv
docker info
```

Se der erro, **abra o Docker Desktop primeiro**.

### 2. Iniciar PostgreSQL (Raiz)

```powershell
docker-compose up -d
docker ps  # Verificar se está rodando
```

### 3. Configurar Banco (Backend)

```powershell
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run test:connection
```

### 4. Iniciar Backend (Backend)

```powershell
npm run dev
```

### 5. Iniciar Admin (Admin) - Opcional

```powershell
cd ..\admin
npm run dev
```

## 📝 Comandos NPM na Raiz

**Localização**: `C:\Junior\ultraiptv`

```powershell
# Instalar tudo
npm run setup

# Iniciar backend
npm run dev:backend

# Iniciar admin
npm run dev:admin

# Iniciar mobile
npm run dev:mobile

# Docker
npm run docker:up      # Iniciar PostgreSQL
npm run docker:down    # Parar PostgreSQL
npm run docker:logs    # Ver logs
npm run start:docker   # Script completo (verifica Docker + inicia)
```

## ❌ Erros Comuns

### "Missing script: start:docker"

**Causa**: Executando no lugar errado

**Solução**: Execute na **raiz** (`C:\Junior\ultraiptv`), não em `backend`

### "Docker não está rodando"

**Causa**: Docker Desktop não está aberto

**Solução**: 
1. Abra o Docker Desktop
2. Aguarde até aparecer "Docker Desktop is running"
3. Tente novamente

### "Cannot find module"

**Causa**: Dependências não instaladas

**Solução**: 
```powershell
npm run setup
```

## ✅ Checklist Rápido

- [ ] Docker Desktop **ABERTO** e **RODANDO**
- [ ] Estou na pasta correta para cada comando
- [ ] Container PostgreSQL rodando (`docker ps`)
- [ ] Migrações executadas (`npm run prisma:migrate`)
- [ ] Backend rodando (`npm run dev`)

