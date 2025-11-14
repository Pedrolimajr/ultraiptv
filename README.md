# 🎬 ULTRAIPTV - Aplicativo Completo de IPTV

Aplicativo completo de IPTV desenvolvido 100% no VS Code, compatível com Android TV, Smart TVs e dispositivos móveis.

## 📋 Estrutura do Projeto

```
ultraiptv/
├── mobile/          # App React Native + Expo
├── backend/         # API Node.js + Express + PostgreSQL
├── admin/           # Painel Admin React + Vite + Tailwind
└── README.md
```

## 🚀 Instalação Rápida

### 1. Instalar todas as dependências

```bash
npm run setup
```

### 2. Configurar Backend

```bash
cd backend
cp .env.example .env
# Editar .env com suas configurações
npm run prisma:generate
npm run prisma:migrate
```

### 3. Iniciar Backend

```bash
npm run dev:backend
```

### 4. Iniciar Painel Admin

```bash
npm run dev:admin
```

### 5. Iniciar App Mobile

```bash
npm run dev:mobile
```

## 📱 Gerar APK (EAS Build)

```bash
cd mobile
npm install -g eas-cli
eas login
eas build -p android --profile apk
```

## 🔧 Tecnologias

### Front-end Mobile
- React Native
- Expo SDK
- React Navigation
- Expo AV (Player)
- React Native Android TV

### Back-end
- Node.js
- Express
- PostgreSQL
- Prisma ORM
- JWT Authentication

### Painel Admin
- React
- Vite
- Tailwind CSS
- React Router

## 📡 API Externa

O app integra com a API: `http://aguacomgas.shop`

Endpoints utilizados:
- `/live` - Canais ao vivo
- `/movies` - Filmes
- `/series` - Séries
- `/epg` - Programação
- `/profile` - Perfil do usuário

## 📖 Documentação Completa

Consulte a documentação em cada pasta:
- [Mobile App](./mobile/README.md)
- [Backend API](./backend/README.md)
- [Painel Admin](./admin/README.md)

## 🎯 Funcionalidades

✅ Login com validação
✅ Dashboard interativo
✅ Player de vídeo integrado
✅ EPG sincronizado
✅ Catch Up
✅ Multiscreen
✅ Configurações completas
✅ Painel administrativo
✅ Controle de dispositivos
✅ Controle parental

## 📝 Licença

MIT

