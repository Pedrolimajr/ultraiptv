# 📱 ULTRAIPTV Mobile App

Aplicativo React Native + Expo para Android TV e dispositivos móveis.

## 🚀 Instalação

```bash
npm install
```

## 🏃 Executar

```bash
# Desenvolvimento
npm start

# Android
npm run android

# iOS
npm run ios
```

## 📦 Gerar APK

```bash
# Instalar EAS CLI globalmente
npm install -g eas-cli

# Login no Expo
eas login

# Build APK
eas build -p android --profile apk
```

## 🔧 Configuração

Edite `config/api.ts` para configurar a URL da API externa.

## 📱 Funcionalidades

- ✅ Login com validação
- ✅ Dashboard interativo
- ✅ Player de vídeo (expo-av)
- ✅ Canais ao vivo
- ✅ Filmes
- ✅ Séries
- ✅ Configurações
- ✅ Suporte Android TV

## 📂 Estrutura

```
mobile/
├── app/              # Telas (expo-router)
├── config/           # Configurações
├── assets/           # Imagens, fontes, etc.
└── package.json
```

