# 🚀 Como Iniciar o Projeto - ULTRAIPTV

## ⚠️ IMPORTANTE: Docker Desktop Precisa Estar Rodando!

Antes de tudo, você precisa iniciar o **Docker Desktop**.

### Passo 1: Iniciar Docker Desktop

1. Procure por **"Docker Desktop"** no menu Iniciar do Windows
2. Clique para abrir
3. **Aguarde** até aparecer a mensagem: **"Docker Desktop is running"**
4. Você verá o ícone da baleia do Docker na bandeja do sistema (canto inferior direito)

### Passo 2: Iniciar PostgreSQL

Depois que o Docker Desktop estiver rodando, execute:

```powershell
# Opção 1: Script automático (recomendado)
npm run start:docker

# Opção 2: Manual
docker-compose up -d
```

### Passo 3: Verificar se está rodando

```powershell
docker ps
```

Você deve ver o container `ultraiptv-db` na lista.

### Passo 4: Configurar Banco de Dados

```powershell
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### Passo 5: Testar Conexão

```powershell
npm run test:connection
```

Deve aparecer: `✅ Conectado!`

### Passo 6: Iniciar Backend

```powershell
npm run dev
```

O servidor estará em `http://localhost:3001`

## 📋 Comandos Rápidos

```powershell
# Iniciar tudo (Docker + PostgreSQL)
npm run start:docker

# Ver status dos containers
docker ps

# Ver logs do PostgreSQL
docker-compose logs -f postgres

# Parar PostgreSQL
docker-compose down

# Reiniciar PostgreSQL
docker-compose restart
```

## 🐛 Problemas?

### Erro: "Docker Desktop não está rodando"

**Solução**: 
1. Abra o Docker Desktop
2. Aguarde até aparecer "Docker Desktop is running"
3. Tente novamente

### Erro: "Porta 5432 já em uso"

Se você já tem PostgreSQL instalado localmente:

```powershell
# Parar serviço local
Get-Service | Where-Object { $_.Name -like "*postgresql*" } | Stop-Service
```

Ou altere a porta no `docker-compose.yml`.

### Verificar se Docker está rodando

```powershell
docker info
```

Se aparecer informações do Docker, está rodando. Se der erro, o Docker não está rodando.

## ✅ Checklist Completo

- [ ] Docker Desktop instalado
- [ ] Docker Desktop rodando (ícone na bandeja)
- [ ] Container PostgreSQL rodando (`docker ps`)
- [ ] Arquivo `.env` existe em `backend/`
- [ ] Prisma Client gerado (`npm run prisma:generate`)
- [ ] Migrações executadas (`npm run prisma:migrate`)
- [ ] Conexão testada (`npm run test:connection`)
- [ ] Backend iniciado (`npm run dev`)

## 🎯 Próximos Passos

Depois que o backend estiver rodando:

1. **Iniciar Painel Admin**:
   ```powershell
   cd admin
   npm run dev
   ```
   Acesse: `http://localhost:5173`

2. **Iniciar App Mobile**:
   ```powershell
   cd mobile
   npm start
   ```

## 📚 Mais Ajuda

- `INICIO_RAPIDO.md` - Guia rápido
- `SETUP_DOCKER.md` - Guia completo do Docker
- `SOLUCAO_ERRO_BANCO.md` - Solução de problemas

