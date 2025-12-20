# 🎨 Solução: Painel Admin Não Está Acessível

## ❌ Erro

```
ERR_CONNECTION_REFUSED
Não é possível acessar esse site
A conexão com localhost foi recusada.
```

## ✅ Causa

O **painel admin não está rodando**. Você precisa iniciá-lo.

## 🚀 Solução

### Passo 1: Verificar se Dependências Estão Instaladas

```powershell
cd admin
npm install
```

### Passo 2: Iniciar Painel Admin

**IMPORTANTE**: Abra um **NOVO terminal** (deixe o backend rodando no terminal anterior)

```powershell
cd admin
npm run dev
```

Você verá algo como:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Passo 3: Acessar Painel

Acesse: `http://localhost:5173`

## 📋 Checklist

- [ ] Backend está rodando (`http://localhost:3001`)
- [ ] Dependências do admin instaladas (`npm install` na pasta admin)
- [ ] Painel admin rodando (`npm run dev` na pasta admin)
- [ ] Acessando a URL correta: `http://localhost:5173`

## 🐛 Problemas Comuns

### Porta 5173 já em uso

Se a porta estiver ocupada, o Vite vai usar outra porta (ex: 5174).

**Solução**: Veja qual porta está sendo usada no terminal onde você rodou `npm run dev`.

### Dependências não instaladas

**Erro**: `Cannot find module` ou similar

**Solução**:
```powershell
cd admin
npm install
```

### Backend não está rodando

O painel admin precisa do backend rodando.

**Solução**:
```powershell
cd backend
npm run dev
```

## 🎯 Sequência Correta

### Terminal 1: Backend
```powershell
cd backend
npm run dev
# Deixe rodando
```

### Terminal 2: Painel Admin
```powershell
cd admin
npm install  # Se ainda não instalou
npm run dev
# Deixe rodando
```

### Terminal 3: (Opcional) Criar Admin
```powershell
cd backend
npm run reset:admin
```

## 📍 URLs Importantes

- **Backend API**: `http://localhost:3001`
- **Painel Admin**: `http://localhost:5173`
- **Health Check**: `http://localhost:3001/health`

## 💡 Dica

Mantenha **dois terminais abertos**:
1. Um com o backend rodando
2. Outro com o painel admin rodando

## 🆘 Ainda com Problemas?

1. Verifique se o backend está rodando: `http://localhost:3001/health`
2. Verifique se o painel admin está rodando (veja o terminal)
3. Verifique a porta correta (pode ser 5174, 5175, etc.)
4. Verifique o console do navegador (F12) para ver erros





