# ✅ Solução: CORS - Proxy no Backend

## 🔍 Problema Identificado

A API externa `http://aguacomgas.shop` está bloqueando requisições CORS do navegador:
```
Access to fetch at 'http://aguacomgas.shop/live' from origin 'http://localhost:8081' 
has been blocked by CORS policy
```

## ✅ Solução Implementada

Criado **proxy no backend** que:
1. Recebe requisições do app (sem problemas de CORS)
2. Faz requisições para a API externa (servidor para servidor, sem CORS)
3. Retorna os dados para o app

## 📁 Arquivos Criados/Modificados

### Novo Arquivo:
- `backend/src/routes/content.js` - Rotas proxy para API externa

### Arquivos Modificados:
- `backend/src/server.js` - Adicionada rota `/api/content`
- `mobile/config/api.ts` - Endpoints agora apontam para o backend
- `mobile/app/live.tsx` - Usa endpoint do backend
- `mobile/app/movies.tsx` - Usa endpoint do backend
- `mobile/app/series.tsx` - Usa endpoint do backend

## 🔄 Como Funciona Agora

### Antes (Não funcionava):
```
App → API Externa (CORS bloqueado ❌)
```

### Agora (Funciona):
```
App → Backend → API Externa → Backend → App ✅
```

## 🚀 Próximos Passos

### 1. Reiniciar o Backend

**IMPORTANTE**: Reinicie o backend para carregar as novas rotas:

```powershell
# No terminal do backend, pressione Ctrl+C para parar
# Depois execute:
cd backend
npm run dev
```

### 2. Recarregar o App

Recarregue o app no navegador (F5)

### 3. Testar

Tente acessar:
- Canais (LIVE TV)
- Filmes
- Séries

## ⚙️ Configuração

O proxy usa o **username** do usuário autenticado como token para a API externa.

Se a API externa precisar de autenticação diferente, ajuste em:
- `backend/src/routes/content.js`

## 🐛 Se Ainda Não Funcionar

1. Verifique se o backend está rodando: `http://localhost:3001/health`
2. Verifique os logs do backend para ver erros
3. Verifique se a API externa aceita o username como token
4. Pode ser necessário fazer login na API externa primeiro

## 📝 Nota

Se a API externa precisar de um token diferente (não o username), você pode:
1. Fazer login na API externa no backend
2. Armazenar o token da API externa
3. Usar esse token nas requisições

