# ⚠️ LEIA PRIMEIRO - Docker Desktop Precisa Estar Rodando!

## 🚨 ERRO COMUM

Se você está vendo este erro:

```
unable to get image 'postgres:15-alpine': error during connect: 
open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
```

**Significa que o Docker Desktop NÃO está rodando!**

## ✅ SOLUÇÃO (3 Passos Simples)

### Passo 1: Abrir Docker Desktop

1. Pressione a tecla **Windows** (Win)
2. Digite: **"Docker Desktop"**
3. Clique para abrir
4. **AGUARDE** 1-2 minutos até aparecer: **"Docker Desktop is running"**

### Passo 2: Verificar se Está Rodando

Execute este comando:

```powershell
docker info
```

**Se aparecer informações do Docker** = ✅ Está rodando!  
**Se der erro** = ❌ Ainda não está pronto, aguarde mais um pouco.

### Passo 3: Iniciar PostgreSQL

Agora sim, execute:

```powershell
docker-compose up -d
```

## 🎯 Como Saber se Docker Está Rodando?

### ✅ Sinais de que está rodando:

- ✅ Ícone da **baleia do Docker** visível na bandeja do sistema (canto inferior direito)
- ✅ Mensagem "Docker Desktop is running" na janela do Docker
- ✅ Comando `docker info` funciona sem erros

### ❌ Sinais de que NÃO está rodando:

- ❌ Não há ícone da baleia na bandeja
- ❌ Comando `docker info` dá erro
- ❌ Erro "cannot find the file specified"

## 📋 Sequência Completa Correta

```powershell
# 1. Abrir Docker Desktop (manualmente pelo Windows)

# 2. Verificar se está rodando
docker info

# 3. Se estiver OK, iniciar PostgreSQL
docker-compose up -d

# 4. Verificar container
docker ps

# 5. Configurar banco
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## 🐛 Ainda com Problemas?

### Docker Desktop não inicia

1. Reinicie o computador
2. Execute o Docker Desktop como Administrador
3. Verifique se há atualizações disponíveis

### Docker Desktop não aparece no menu

1. Procure por "Docker" na pasta de programas
2. Ou baixe novamente: https://www.docker.com/products/docker-desktop

### Porta 5432 já em uso

Se você já tem PostgreSQL instalado:

```powershell
# Parar serviço local
Get-Service | Where-Object { $_.Name -like "*postgresql*" } | Stop-Service
```

## 💡 Dica Importante

**Mantenha o Docker Desktop aberto** enquanto trabalha no projeto. Ele precisa estar rodando para o PostgreSQL funcionar.

## 📚 Mais Ajuda

- `ERRO_DOCKER.md` - Solução detalhada do erro
- `COMANDOS_CORRETOS.md` - Onde executar cada comando
- `SETUP_DOCKER.md` - Guia completo do Docker

