# 🔧 ULTRAIPTV Backend

API Node.js + Express + PostgreSQL para gerenciamento de usuários IPTV.

## 🚀 Instalação

```bash
npm install
```

## ⚙️ Configuração

1. Copie `.env.example` para `.env`
2. Configure as variáveis de ambiente:
   - `DATABASE_URL`: URL de conexão PostgreSQL
   - `JWT_SECRET`: Chave secreta para JWT
   - `PORT`: Porta do servidor (padrão: 3001)

## 🗄️ Banco de Dados

```bash
# Gerar Prisma Client
npm run prisma:generate

# Executar migrações
npm run prisma:migrate

# Abrir Prisma Studio (opcional)
npm run prisma:studio
```

## 🏃 Executar

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 📡 Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verificar token

### Usuários (Admin)
- `GET /api/users` - Listar usuários
- `GET /api/users/:id` - Buscar usuário
- `POST /api/users` - Criar usuário
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Deletar usuário
- `POST /api/users/:id/renew` - Renovar expiração

### Logs (Admin)
- `GET /api/logs` - Listar logs de login

### Dashboard (Admin)
- `GET /api/dashboard/stats` - Estatísticas

## 🔐 Autenticação

Todas as rotas protegidas requerem header:
```
Authorization: Bearer <token>
```

## 📝 Exemplo de Criação de Usuário

```json
POST /api/users
{
  "username": "usuario123",
  "password": "senha123", // Opcional - será gerada automaticamente se não fornecida
  "expirationType": "days", // "days", "date", "hours"
  "expirationValue": 30, // 30 dias
  "deviceLimit": 1,
  "role": "USER"
}
```

