# ⚡ Início Rápido - ULTRAIPTV com Docker

## ✅ Arquivos Criados

- ✅ `backend/.env` - Configurações do banco de dados
- ✅ `docker-compose.yml` - Configuração do PostgreSQL
- ✅ Scripts de setup

## 🚀 Passo a Passo

### 1. Iniciar Docker Desktop

**IMPORTANTE**: O Docker Desktop precisa estar rodando!

1. Abra o **Docker Desktop** no Windows
2. Aguarde até aparecer "Docker Desktop is running"
3. Verifique o ícone do Docker na bandeja do sistema

### 2. Iniciar PostgreSQL

```powershell
# Na raiz do projeto
docker-compose up -d
```

Ou use o script automático:

```powershell
npm run setup:docker
```

### 3. Verificar se está rodando

```powershell
docker ps
```

Você deve ver o container `ultraiptv-db` na lista.

### 4. Executar Migrações do Banco

```powershell
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### 5. Testar Conexão

```powershell
npm run test:connection
```

Deve aparecer: `✅ Conectado!`

### 6. Iniciar Backend

```powershell
npm run dev
```

O servidor estará rodando em `http://localhost:3001`

## 📋 Comandos Úteis

```powershell
# Iniciar PostgreSQL
docker-compose up -d

# Parar PostgreSQL
docker-compose down

# Ver logs do PostgreSQL
docker-compose logs -f postgres

# Ver status dos containers
docker ps

# Acessar banco via psql
docker exec -it ultraiptv-db psql -U ultraiptv_user -d ultraiptv
```

## 🐛 Problemas Comuns

### Docker Desktop não está rodando

**Erro**: `unable to get image` ou `The system cannot find the file specified`

**Solução**: 
1. Abra o Docker Desktop
2. Aguarde até aparecer "Docker Desktop is running"
3. Tente novamente

### Porta 5432 já em uso

Se você já tem PostgreSQL instalado:

```powershell
# Parar serviço local
Get-Service | Where-Object { $_.Name -like "*postgresql*" } | Stop-Service
```

Ou altere a porta no `docker-compose.yml` (linha 9):
```yaml
ports:
  - "5433:5432"  # Mude para 5433
```

E atualize `backend/.env`:
```env
DATABASE_URL="postgresql://ultraiptv_user:senha123@localhost:5433/ultraiptv?schema=public"
```

## ✅ Checklist

- [ ] Docker Desktop está rodando
- [ ] Container PostgreSQL está rodando (`docker ps`)
- [ ] Arquivo `.env` existe em `backend/`
- [ ] Migrações executadas (`npm run prisma:migrate`)
- [ ] Conexão testada (`npm run test:connection`)
- [ ] Backend iniciado (`npm run dev`)

## 🎯 Próximos Passos

Após o backend estar rodando:

1. **Iniciar Painel Admin**:
   ```powershell
   cd admin
   npm run dev
   ```

2. **Criar usuário admin**:
   - Acesse `http://localhost:5173`
   - Ou use o script: `cd backend && npm run setup:db`

3. **Iniciar App Mobile**:
   ```powershell
   cd mobile
   npm start
   ```

## 📚 Documentação Completa

- `SETUP_DOCKER.md` - Guia completo do Docker
- `SOLUCAO_ERRO_BANCO.md` - Solução de problemas
- `INSTALACAO.md` - Instalação completa

