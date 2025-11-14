# ❌ Erro: Docker Desktop Não Está Rodando

## 🚨 Erro Encontrado

```
unable to get image 'postgres:15-alpine': error during connect: 
open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
```

Este erro significa que o **Docker Desktop não está rodando**.

## ✅ Solução Passo a Passo

### 1. Abrir Docker Desktop

1. Pressione `Win` (tecla Windows)
2. Digite: **"Docker Desktop"**
3. Clique para abrir

### 2. Aguardar Docker Iniciar

- Aguarde até aparecer a mensagem: **"Docker Desktop is running"**
- Você verá o ícone da **baleia do Docker** na bandeja do sistema (canto inferior direito)
- Isso pode levar 1-2 minutos na primeira vez

### 3. Verificar se Está Rodando

Abra um novo PowerShell e execute:

```powershell
docker info
```

Se aparecer informações do Docker, está rodando! ✅

Se der erro, o Docker ainda não está pronto. ⏳

### 4. Iniciar PostgreSQL

**IMPORTANTE**: Execute na **raiz do projeto** (não dentro de `backend`):

```powershell
# Voltar para raiz (se estiver em backend)
cd C:\Junior\ultraiptv

# Iniciar PostgreSQL
docker-compose up -d
```

Ou use o script:

```powershell
# Na raiz do projeto
npm run start:docker
```

### 5. Verificar Container

```powershell
docker ps
```

Você deve ver o container `ultraiptv-db` rodando.

## 📋 Comandos Corretos

### Na Raiz do Projeto (`C:\Junior\ultraiptv`)

```powershell
# Verificar Docker
docker info

# Iniciar PostgreSQL
docker-compose up -d

# Ver containers
docker ps

# Ver logs
docker-compose logs -f postgres
```

### No Backend (`C:\Junior\ultraiptv\backend`)

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

## 🐛 Problemas Comuns

### Docker Desktop não inicia

1. Reinicie o computador
2. Verifique se há atualizações do Docker Desktop
3. Tente executar como Administrador

### Porta 5432 já em uso

Se você já tem PostgreSQL instalado:

```powershell
# Parar serviço local
Get-Service | Where-Object { $_.Name -like "*postgresql*" } | Stop-Service
```

### Container não inicia

```powershell
# Ver logs
docker-compose logs postgres

# Remover e recriar
docker-compose down -v
docker-compose up -d
```

## ✅ Checklist

- [ ] Docker Desktop instalado
- [ ] Docker Desktop **ABERTO** e **RODANDO**
- [ ] Ícone da baleia visível na bandeja do sistema
- [ ] `docker info` funciona sem erros
- [ ] Executando comandos na **raiz do projeto**
- [ ] Container `ultraiptv-db` rodando (`docker ps`)

## 🎯 Próximos Passos

Depois que o Docker estiver rodando e o PostgreSQL iniciado:

```powershell
# 1. Na raiz
cd C:\Junior\ultraiptv
docker-compose up -d

# 2. No backend
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run test:connection
npm run dev
```

## 💡 Dica

Mantenha o **Docker Desktop aberto** enquanto trabalha no projeto. Ele precisa estar rodando para o PostgreSQL funcionar.

