# 🔧 Solução: Erro de Conexão com Banco de Dados

## ❌ Erro Encontrado

```
Error: Could not parse schema engine response: SyntaxError: Unexpected token E in JSON at position 0
```

## 🔍 Causas Possíveis

1. **DATABASE_URL incorreta** - Usando External URL ao invés de Internal URL
2. **Banco ainda não está pronto** - Banco pode estar inicializando
3. **Formato da URL incorreto** - URL mal formatada

## ✅ Solução

### 1. Verificar DATABASE_URL no Render

1. No serviço web (`ultraiptv-backend`), vá em **Environment**
2. Verifique a variável `DATABASE_URL`
3. **IMPORTANTE**: Deve usar a **Internal Database URL** (não a External!)

**Como obter a Internal Database URL:**
1. Vá no banco PostgreSQL criado
2. Na seção **Connections**, procure por **Internal Database URL**
3. Copie essa URL (geralmente começa com `postgresql://` e tem `-a` no final do hostname)
4. Cole no `DATABASE_URL` do serviço web

### 2. Formato Correto da URL

A URL deve ter este formato:
```
postgresql://user:password@dpg-xxxxx-a.oregon-postgres.render.com/ultraiptv?sslmode=require
```

⚠️ **NÃO use** a External Database URL que tem `-external` no hostname!

### 3. Aguardar Banco Estar Pronto

Criei um script que aguarda o banco estar pronto antes de rodar migrações. O script já foi adicionado ao `package.json`.

### 4. Verificar se Banco e Serviço Estão na Mesma Região

- Banco e serviço web devem estar na **mesma região** (ex: ambos em Oregon)
- Se estiverem em regiões diferentes, use a External URL (mas não é recomendado)

## 🔄 Próximos Passos

1. **Verifique a DATABASE_URL** no Render
2. **Use a Internal Database URL** (se ainda não estiver usando)
3. **Faça um novo deploy** (o Render deve detectar automaticamente)
4. **Aguarde o build** completar

## 🐛 Se Ainda Não Funcionar

Execute no Shell do Render para testar a conexão:

```bash
cd backend
node scripts/wait-for-db.js
```

Ou teste manualmente:

```bash
cd backend
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => { console.log('✅ Conectado!'); process.exit(0); }).catch(e => { console.error('❌ Erro:', e.message); process.exit(1); })"
```

---

**Dica**: O script `wait-for-db.js` aguarda até 60 segundos (30 tentativas x 2 segundos) para o banco estar pronto antes de tentar rodar as migrações.
