# 🔧 Solução: Erro de Conexão com Banco de Dados

## ❌ Erro Encontrado

```
Error: P1001: Can't reach database server at `localhost:5432`
```

Este erro significa que o PostgreSQL não está rodando ou não está acessível.

## ✅ Soluções

### Opção 1: Instalar PostgreSQL (Se não estiver instalado)

#### Windows

1. **Baixar PostgreSQL**
   - Acesse: https://www.postgresql.org/download/windows/
   - Baixe o instalador oficial
   - Ou use: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

2. **Instalar**
   - Execute o instalador
   - Durante a instalação, defina:
     - **Porta**: 5432 (padrão)
     - **Senha do usuário postgres**: Anote esta senha!
     - **Localização**: Deixe o padrão

3. **Verificar Instalação**
   - Abra o **pgAdmin** (instalado junto)
   - Ou teste via linha de comando:
   ```powershell
   psql --version
   ```

### Opção 2: Verificar se PostgreSQL está Rodando

#### Windows (PowerShell)

```powershell
# Verificar se o serviço está rodando
Get-Service -Name postgresql*

# Se não estiver rodando, iniciar:
Start-Service -Name postgresql-x64-*  # Substitua * pela versão
```

#### Windows (Serviços)

1. Pressione `Win + R`
2. Digite `services.msc`
3. Procure por **postgresql**
4. Clique com botão direito > **Iniciar**

### Opção 3: Usar Docker (Alternativa Rápida)

Se você tem Docker instalado:

```bash
# Criar e iniciar container PostgreSQL
docker run --name ultraiptv-db \
  -e POSTGRES_USER=ultraiptv_user \
  -e POSTGRES_PASSWORD=sua_senha_aqui \
  -e POSTGRES_DB=ultraiptv \
  -p 5432:5432 \
  -d postgres:15

# Verificar se está rodando
docker ps
```

### Opção 4: Configurar Banco de Dados Manualmente

1. **Conectar ao PostgreSQL**
   ```powershell
   psql -U postgres
   # Digite a senha do postgres
   ```

2. **Criar Banco e Usuário**
   ```sql
   -- Criar banco de dados
   CREATE DATABASE ultraiptv;

   -- Criar usuário
   CREATE USER ultraiptv_user WITH PASSWORD 'sua_senha_aqui';

   -- Dar permissões
   GRANT ALL PRIVILEGES ON DATABASE ultraiptv TO ultraiptv_user;

   -- Conectar ao banco
   \c ultraiptv

   -- Dar permissões no schema
   GRANT ALL ON SCHEMA public TO ultraiptv_user;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ultraiptv_user;
   ```

3. **Atualizar .env**
   ```env
   DATABASE_URL="postgresql://ultraiptv_user:sua_senha_aqui@localhost:5432/ultraiptv?schema=public"
   ```

### Opção 5: Usar SQLite (Desenvolvimento Rápido)

Se quiser testar rapidamente sem PostgreSQL:

1. **Alterar schema.prisma**
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = "file:./dev.db"
   }
   ```

2. **Atualizar .env**
   ```env
   DATABASE_URL="file:./dev.db"
   ```

3. **Regenerar Prisma**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

⚠️ **Nota**: SQLite é apenas para desenvolvimento. Use PostgreSQL em produção.

## 🔍 Verificar Conexão

### Teste 1: Via psql

```powershell
psql -U ultraiptv_user -d ultraiptv -h localhost
```

### Teste 2: Via Node.js

```bash
cd backend
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => { console.log('✅ Conectado!'); process.exit(0); }).catch(e => { console.error('❌ Erro:', e.message); process.exit(1); })"
```

### Teste 3: Verificar Porta

```powershell
# Verificar se a porta 5432 está em uso
netstat -ano | findstr :5432
```

## 📝 Checklist de Verificação

- [ ] PostgreSQL está instalado
- [ ] Serviço PostgreSQL está rodando
- [ ] Banco de dados `ultraiptv` existe
- [ ] Usuário `ultraiptv_user` existe
- [ ] Senha está correta no `.env`
- [ ] Porta 5432 está acessível
- [ ] Firewall não está bloqueando

## 🚀 Após Resolver

Depois de resolver a conexão:

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## 💡 Dicas

1. **Senha do postgres**: Se esqueceu, pode resetar ou criar novo usuário
2. **Porta diferente**: Se usar outra porta, atualize no `.env`
3. **Host diferente**: Se PostgreSQL estiver em outro servidor, atualize o host no `.env`
4. **Windows Firewall**: Pode estar bloqueando. Adicione exceção para PostgreSQL

## 🆘 Ainda com Problemas?

1. Verifique os logs do PostgreSQL
2. Tente conectar via pgAdmin
3. Verifique se há outro serviço usando a porta 5432
4. Reinicie o serviço PostgreSQL

