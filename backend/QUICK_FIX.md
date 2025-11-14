# ⚡ Solução Rápida - Erro de Banco de Dados

## 🚨 Erro
```
Error: P1001: Can't reach database server at `localhost:5432`
```

## ✅ Solução Rápida (3 opções)

### Opção 1: Verificar PostgreSQL (Windows PowerShell)

```powershell
# No diretório backend
.\scripts\check-postgres.ps1
```

Este script vai:
- ✅ Verificar se PostgreSQL está instalado
- ✅ Verificar se o serviço está rodando
- ✅ Testar a conexão

### Opção 2: Iniciar PostgreSQL Manualmente

```powershell
# Ver serviços PostgreSQL
Get-Service | Where-Object { $_.Name -like "*postgresql*" }

# Iniciar serviço (substitua pelo nome do seu serviço)
Start-Service -Name "postgresql-x64-15"  # ou sua versão
```

### Opção 3: Usar Docker (Mais Rápido)

Se você tem Docker instalado:

```bash
docker run --name ultraiptv-db \
  -e POSTGRES_USER=ultraiptv_user \
  -e POSTGRES_PASSWORD=senha123 \
  -e POSTGRES_DB=ultraiptv \
  -p 5432:5432 \
  -d postgres:15
```

Depois atualize o `.env`:
```env
DATABASE_URL="postgresql://ultraiptv_user:senha123@localhost:5432/ultraiptv?schema=public"
```

## 📝 Depois de Resolver

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## 🆘 Ainda com Problemas?

Consulte o guia completo: `SOLUCAO_ERRO_BANCO.md`

