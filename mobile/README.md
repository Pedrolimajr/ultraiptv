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

1. Copie `.env.example` para `.env` (crie se não existir) e defina:
   ```
   EXPO_PUBLIC_BACKEND_URL=http://SEU_IP_LOCAL:3001
   ```
   > Obrigatório para builds/testes em dispositivos reais. Em desenvolvimento, o app tenta detectar o IP automaticamente usando o host do Metro bundler.
2. Inicie o app, vá até o **Dashboard** e abra o botão `🔌 Playlist` para informar:
   - Nome amigável (ex.: "Servidor Principal")
   - Usuário / Senha do painel Xtream
   - URL com porta (ex.: `http://dominio.com:8080`)
   O backend receberá esses dados via headers e irá montar as rotas `player_api.php` automaticamente.
3. Ajuste `config/api.ts` apenas se usar outra porta ou endpoint dedicado.

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

