# 🎛️ ULTRAIPTV Painel Admin

Painel administrativo web para gerenciar usuários IPTV.

## 🚀 Instalação

```bash
npm install
```

## 🏃 Executar

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Preview
npm run preview
```

## 🔧 Configuração

O painel se conecta automaticamente ao backend em `http://localhost:3001`.

Para alterar, configure a variável `VITE_API_URL` no `.env`.

## 📋 Funcionalidades

- ✅ Login de administrador
- ✅ Dashboard com estatísticas
- ✅ Gerenciamento de usuários
- ✅ Criação automática de senhas
- ✅ Controle de expiração
- ✅ Bloqueio/desbloqueio de usuários
- ✅ Visualização de logs de login

## 🔐 Acesso

Apenas usuários com role `ADMIN` podem acessar o painel.

