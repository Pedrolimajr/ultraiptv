# 📍 Onde Executar Cada Comando

## ⚠️ IMPORTANTE: Todos os Comandos são no TERMINAL!

O **Docker Desktop** é apenas uma **aplicação** que precisa estar **aberta e rodando** em segundo plano. Você **NÃO executa comandos dentro do Docker Desktop**.

## 🖥️ Onde Executar: TERMINAL (PowerShell)

### ✅ TODOS os comandos abaixo são executados no TERMINAL

---

## 📋 Passo a Passo Completo

### 1️⃣ Abrir Docker Desktop (Aplicação do Windows)

**Onde**: Menu Iniciar do Windows (NÃO é no terminal)

1. Pressione tecla **Windows**
2. Digite: **"Docker Desktop"**
3. Clique para abrir
4. Aguarde até aparecer: **"Docker Desktop is running"**
5. **Deixe aberto** (não precisa fazer mais nada nele)

### 2️⃣ Verificar Docker (TERMINAL)

**Onde**: Terminal PowerShell (na raiz do projeto)

```powershell
# Você está aqui: C:\Junior\ultraiptv
npm run check:docker
```

**Resultado esperado**: "Docker Desktop esta rodando!"

### 3️⃣ Iniciar PostgreSQL (TERMINAL)

**Onde**: Terminal PowerShell (na raiz do projeto)

```powershell
# Você está aqui: C:\Junior\ultraiptv
docker-compose up -d
```

**Resultado esperado**: Container iniciado

### 4️⃣ Verificar Container (TERMINAL)

**Onde**: Terminal PowerShell (na raiz do projeto)

```powershell
# Você está aqui: C:\Junior\ultraiptv
docker ps
```

**Resultado esperado**: Ver o container `ultraiptv-db` na lista

### 5️⃣ Configurar Banco (TERMINAL)

**Onde**: Terminal PowerShell (dentro da pasta backend)

```powershell
# Primeiro, entrar na pasta backend
cd backend

# Agora você está aqui: C:\Junior\ultraiptv\backend
npm run prisma:generate
npm run prisma:migrate
npm run test:connection
npm run dev
```

---

## 🎯 Resumo Visual

```
┌─────────────────────────────────────┐
│  DOCKER DESKTOP (Aplicação)        │
│  - Apenas abrir e deixar rodando   │
│  - NÃO executa comandos aqui       │
└─────────────────────────────────────┘
              ↓ (precisa estar rodando)
┌─────────────────────────────────────┐
│  TERMINAL POWERSHELL                │
│  - Execute TODOS os comandos aqui  │
│  - npm run check:docker            │
│  - docker-compose up -d            │
│  - cd backend                      │
│  - npm run prisma:generate         │
│  - etc...                          │
└─────────────────────────────────────┘
```

---

## 📍 Localização dos Comandos

### Comandos na RAIZ do projeto

**Localização**: `C:\Junior\ultraiptv`

```powershell
# Verificar Docker
npm run check:docker

# Iniciar PostgreSQL
docker-compose up -d

# Ver containers
docker ps

# Ver logs
docker-compose logs -f postgres
```

### Comandos no BACKEND

**Localização**: `C:\Junior\ultraiptv\backend`

```powershell
# Primeiro, entrar na pasta
cd backend

# Depois executar
npm run prisma:generate
npm run prisma:migrate
npm run test:connection
npm run dev
```

---

## ✅ Checklist

- [ ] Docker Desktop **ABERTO** (aplicação do Windows)
- [ ] Docker Desktop mostrando "Docker Desktop is running"
- [ ] Terminal PowerShell **ABERTO**
- [ ] Estou na pasta correta no terminal
- [ ] Executando comandos no **TERMINAL**, não no Docker Desktop

---

## 💡 Dica

**Docker Desktop** = Aplicação que precisa estar rodando (como o Chrome ou Word)  
**Terminal** = Onde você executa os comandos (PowerShell)

Mantenha o Docker Desktop aberto, mas execute todos os comandos no Terminal!

