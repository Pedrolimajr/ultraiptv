# 🔐 Solução: Credenciais Inválidas no Painel Admin

## ❌ Problema

Você está vendo "Credenciais inválidas" ao tentar fazer login no painel admin.

## ✅ Soluções

### Opção 1: Resetar Senha do Admin (Recomendado)

Se você já tem um usuário admin mas esqueceu a senha:

```powershell
cd backend
npm run reset:admin
```

Siga as instruções:
1. Escolha o usuário admin
2. Digite a nova senha
3. Anote as credenciais
4. Tente fazer login novamente

### Opção 2: Criar Novo Admin

Se não tem um admin ou quer criar um novo:

```powershell
cd backend
npm run create:admin
```

Siga as instruções:
1. Digite o nome de usuário (ou Enter para "admin")
2. Digite a senha
3. Anote as credenciais
4. Faça login no painel

### Opção 3: Verificar Usuários Existentes

Ver todos os usuários no banco:

```powershell
cd backend
npm run prisma:studio
```

Isso abrirá uma interface web. Verifique:
- Se o usuário existe
- Se o `role` é `ADMIN`
- Se `active` é `true`
- A senha está hasheada (não dá para ver a senha original)

## 🔍 Verificar Problemas

### 1. Verificar se Backend está rodando

O backend precisa estar rodando em `http://localhost:3001`

```powershell
# Verificar se está rodando
curl http://localhost:3001/health
```

Ou abra no navegador: `http://localhost:3001/health`

### 2. Verificar se Usuário é Admin

O painel admin **só aceita usuários com role = 'ADMIN'**

Verifique via Prisma Studio:
```powershell
cd backend
npm run prisma:studio
```

### 3. Verificar se Usuário está Ativo

O usuário precisa ter `active = true`

### 4. Verificar Senha

A senha precisa ter no mínimo 6 caracteres.

## 🚀 Passo a Passo Completo

### 1. Resetar/Criar Admin

```powershell
cd backend
npm run reset:admin
# ou
npm run create:admin
```

### 2. Anotar Credenciais

O script vai mostrar:
```
Usuário: admin
Senha: sua_senha_aqui
```

### 3. Fazer Login

1. Acesse: `http://localhost:5173`
2. Digite o usuário
3. Digite a senha (exatamente como foi criada)
4. Clique em "Entrar"

## 🐛 Problemas Comuns

### "Acesso negado. Apenas administradores."

**Causa**: O usuário não tem `role = 'ADMIN'`

**Solução**: 
```powershell
cd backend
npm run reset:admin
```

Isso vai garantir que o role seja ADMIN.

### "Usuário bloqueado"

**Causa**: O usuário tem `active = false`

**Solução**: O script `reset:admin` já ativa o usuário automaticamente.

### Backend não responde

**Causa**: Backend não está rodando

**Solução**:
```powershell
cd backend
npm run dev
```

### Erro de conexão

**Causa**: Backend não está acessível

**Solução**: 
1. Verifique se está rodando em `http://localhost:3001`
2. Verifique se não há firewall bloqueando
3. Verifique o console do navegador (F12) para ver o erro exato

## 📋 Checklist

- [ ] Backend está rodando (`http://localhost:3001/health`)
- [ ] Usuário admin existe no banco
- [ ] Usuário tem `role = 'ADMIN'`
- [ ] Usuário tem `active = true`
- [ ] Senha tem no mínimo 6 caracteres
- [ ] Credenciais estão corretas (sem espaços extras)
- [ ] Painel admin está rodando (`http://localhost:5173`)

## 💡 Dica

Use o script `reset:admin` que já configura tudo corretamente:
- Define role como ADMIN
- Ativa o usuário
- Reseta a senha

## 🆘 Ainda com Problemas?

1. Verifique o console do navegador (F12) para ver o erro exato
2. Verifique os logs do backend no terminal
3. Verifique se o usuário existe via Prisma Studio
4. Tente criar um novo admin com nome diferente

