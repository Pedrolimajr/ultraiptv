# 🎉 Próximos Passos - Backend Funcionando!

## ✅ O que já está funcionando:

- ✅ Docker Desktop rodando
- ✅ PostgreSQL rodando
- ✅ Banco de dados criado
- ✅ Migrações executadas
- ✅ Backend rodando em `http://localhost:3001`

## 🚀 Próximos Passos:

### 1️⃣ Criar Usuário Admin

Você precisa criar um usuário administrador para acessar o painel admin.

**Opção A: Via Script (Recomendado)**

Abra um **NOVO terminal** (deixe o backend rodando) e execute:

```powershell
cd backend
npm run setup:db
```

Siga as instruções para criar o usuário admin.

**Opção B: Via Prisma Studio**

Em um novo terminal:

```powershell
cd backend
npm run prisma:studio
```

Isso abrirá uma interface web. Crie um usuário manualmente:
- username: `admin`
- password: (será hasheado automaticamente - use bcrypt online ou o script)
- role: `ADMIN`
- active: `true`

**Opção C: Via SQL direto**

```powershell
docker exec -it ultraiptv-db psql -U ultraiptv_user -d ultraiptv
```

Depois execute:
```sql
INSERT INTO "User" (username, password, role, "active", "deviceLimit", "createdAt", "updatedAt")
VALUES ('admin', '$2a$10$rOzJqKqKqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqKqK', 'ADMIN', true, 1, NOW(), NOW());
```

⚠️ **Nota**: A senha precisa ser hasheada. Use o script ou Prisma Studio.

### 2️⃣ Iniciar Painel Admin

Abra um **NOVO terminal** (deixe o backend rodando):

```powershell
cd admin
npm run dev
```

O painel admin estará em: `http://localhost:5173`

**Login:**
- Usuário: `admin` (ou o que você criou)
- Senha: A senha que você definiu

### 3️⃣ Testar o Sistema

1. **Backend API**: `http://localhost:3001/health`
   - Deve retornar: `{"status":"ok","timestamp":"..."}`

2. **Painel Admin**: `http://localhost:5173`
   - Faça login
   - Crie usuários
   - Veja estatísticas

3. **App Mobile** (Opcional):
   ```powershell
   cd mobile
   npm start
   ```

## 📋 Checklist Completo

- [x] Docker Desktop rodando
- [x] PostgreSQL rodando
- [x] Banco de dados criado
- [x] Migrações executadas
- [x] Backend rodando
- [ ] Usuário admin criado
- [ ] Painel admin rodando
- [ ] Login no painel admin funcionando
- [ ] App mobile rodando (opcional)

## 🎯 Comandos Rápidos

### Terminal 1: Backend (já está rodando)
```powershell
# Deixe rodando
cd backend
npm run dev
```

### Terminal 2: Criar Admin
```powershell
cd backend
npm run setup:db
```

### Terminal 3: Painel Admin
```powershell
cd admin
npm run dev
```

### Terminal 4: App Mobile (opcional)
```powershell
cd mobile
npm start
```

## 🔧 Comandos Úteis

```powershell
# Ver logs do backend
# (já está mostrando no terminal)

# Ver logs do PostgreSQL
docker-compose logs -f postgres

# Parar backend
# Pressione Ctrl+C no terminal do backend

# Parar PostgreSQL
docker-compose down

# Reiniciar PostgreSQL
docker-compose restart
```

## 📚 Próximas Funcionalidades

Depois que tudo estiver rodando:

1. **Criar usuários** via painel admin
2. **Testar login** no app mobile
3. **Configurar API externa** (já está configurada: `http://aguacomgas.shop`)
4. **Testar reprodução de vídeo**
5. **Personalizar logo e assets**

## 🆘 Problemas?

- **Erro ao criar usuário**: Verifique se o backend está rodando
- **Não consegue fazer login**: Verifique se criou o usuário corretamente
- **Painel admin não abre**: Verifique se está na porta 5173
- **Erro de conexão**: Verifique se o backend está em `http://localhost:3001`

## 🎉 Parabéns!

Seu backend está funcionando! Agora é só criar o usuário admin e começar a usar o sistema.

