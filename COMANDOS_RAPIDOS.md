# ⚡ Comandos Rápidos - ULTRAIPTV

Guia rápido de comandos para desenvolvimento e produção.

## 🚀 Iniciar Projeto

```bash
# Instalar tudo
npm run setup

# Iniciar backend
npm run dev:backend

# Iniciar painel admin
npm run dev:admin

# Iniciar app mobile
npm run dev:mobile
```

## 📦 Backend

```bash
cd backend

# Desenvolvimento
npm run dev

# Produção
npm start

# Banco de dados
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

## 🎨 Painel Admin

```bash
cd admin

# Desenvolvimento
npm run dev

# Build
npm run build

# Preview
npm run preview
```

## 📱 Mobile App

```bash
cd mobile

# Desenvolvimento
npm start
npm run android
npm run ios

# Build APK
eas build -p android --profile apk

# Build AAB (Play Store)
eas build -p android --profile production
```

## 🗄️ Banco de Dados

```bash
# Conectar ao PostgreSQL
psql -U ultraiptv_user -d ultraiptv

# Backup
pg_dump -U ultraiptv_user ultraiptv > backup.sql

# Restore
psql -U ultraiptv_user ultraiptv < backup.sql
```

## 🔧 Utilitários

```bash
# Limpar node_modules (raiz)
rm -rf node_modules */node_modules

# Reinstalar tudo
npm run setup

# Verificar portas em uso
# Windows
netstat -ano | findstr :3001
netstat -ano | findstr :5173

# Linux/Mac
lsof -i :3001
lsof -i :5173
```

## 📝 Logs

```bash
# Backend logs (se usando PM2)
pm2 logs ultraiptv-backend

# Ver logs do app (Android)
adb logcat | grep ultraiptv
```

## 🐛 Debug

```bash
# Verificar conexão com banco
cd backend
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.$connect().then(() => console.log('OK')).catch(e => console.error(e))"

# Testar API
curl http://localhost:3001/health

# Verificar token JWT
# Use jwt.io para decodificar
```

