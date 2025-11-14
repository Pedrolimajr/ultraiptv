# 🚀 INÍCIO AQUI - ULTRAIPTV

## ⚠️ ANTES DE TUDO: Docker Desktop Precisa Estar Rodando!

Você está vendo esta mensagem porque o **Docker Desktop não está rodando**.

## ✅ FAÇA ISSO AGORA:

### 1️⃣ Abrir Docker Desktop

1. Pressione a tecla **Windows** (ou clique no menu Iniciar)
2. Digite: **"Docker Desktop"**
3. Clique para abrir
4. **AGUARDE** 1-2 minutos

### 2️⃣ Verificar se Está Rodando

Você saberá que está rodando quando:
- ✅ Aparecer a mensagem: **"Docker Desktop is running"**
- ✅ Ver o **ícone da baleia** na bandeja do sistema (canto inferior direito)
- ✅ O comando abaixo funcionar:

```powershell
npm run check:docker
```

Se aparecer "Docker Desktop esta rodando!" = ✅ Pronto!

### 3️⃣ Iniciar PostgreSQL

Agora sim, execute:

```powershell
docker-compose up -d
```

### 4️⃣ Verificar Container

```powershell
docker ps
```

Você deve ver `ultraiptv-db` na lista.

### 5️⃣ Configurar Banco

```powershell
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run test:connection
npm run dev
```

## 📋 Sequência Completa

```powershell
# 1. Abrir Docker Desktop (manualmente)

# 2. Verificar
npm run check:docker

# 3. Iniciar PostgreSQL
docker-compose up -d

# 4. Verificar container
docker ps

# 5. Configurar banco
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run test:connection
npm run dev
```

## 🎯 Status Atual

- ✅ Arquivo `.env` criado
- ✅ `docker-compose.yml` configurado
- ✅ Scripts criados
- ❌ **Docker Desktop não está rodando** ← VOCÊ PRECISA FAZER ISSO

## 💡 Dica

**Mantenha o Docker Desktop aberto** enquanto trabalha no projeto. Ele precisa estar rodando para o PostgreSQL funcionar.

## 🆘 Ainda com Problemas?

Consulte:
- `LEIA_PRIMEIRO.md` - Guia completo
- `ERRO_DOCKER.md` - Solução de problemas
- `COMANDOS_CORRETOS.md` - Onde executar cada comando

---

**Próximo passo**: Abra o Docker Desktop e aguarde até aparecer "Docker Desktop is running"!

