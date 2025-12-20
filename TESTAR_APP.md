# 🧪 Como Testar o App Enquanto Aguarda o Build

## ✅ Sim! Você Pode Testar o App Agora

Existem várias formas de testar o app sem precisar do APK:

## 🚀 Opções de Teste

### Opção 1: Expo Go no Celular (Recomendado) 📱

A forma mais fácil e próxima da experiência real.

#### Passo a Passo:

1. **Instalar Expo Go no celular**:
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent
   - iOS: https://apps.apple.com/app/expo-go/id982107779

2. **Iniciar o servidor de desenvolvimento**:
   ```powershell
   cd mobile
   npm start
   ```

3. **Conectar o celular**:
   - **Mesma rede Wi-Fi**: Escaneie o QR code que aparecer
   - **Ou use túnel**: Pressione `s` para alternar para tunnel mode

4. **Abrir no Expo Go**:
   - Android: Abra Expo Go e escaneie o QR code
   - iOS: Use a câmera do iPhone para escanear

#### Vantagens:
- ✅ Testa no dispositivo real
- ✅ Hot reload (mudanças aparecem instantaneamente)
- ✅ Funciona com Android TV Box (se tiver)

---

### Opção 2: Web Browser (Mais Rápido) 🌐

Testar no navegador (algumas funcionalidades podem ter limitações).

#### Passo a Passo:

1. **Iniciar em modo web**:
   ```powershell
   cd mobile
   npm start
   ```

2. **Pressionar `w`** para abrir no navegador

   Ou diretamente:
   ```powershell
   cd mobile
   npm run web
   ```

3. **Acessar**: O app abrirá automaticamente em `http://localhost:19006`

#### Limitações:
- ⚠️ Player de vídeo pode não funcionar perfeitamente
- ⚠️ Algumas funcionalidades nativas não funcionam
- ✅ Mas você pode testar navegação, layout, etc.

---

### Opção 3: Emulador Android (Se Tiver) 📱

Se você tem Android Studio instalado.

#### Passo a Passo:

1. **Abrir Android Studio**
2. **Criar/Iniciar um AVD** (Android Virtual Device)
3. **Iniciar o app**:
   ```powershell
   cd mobile
   npm run android
   ```

#### Vantagens:
- ✅ Testa em ambiente Android real
- ✅ Pode simular Android TV

---

### Opção 4: Expo Dev Client (Avançado) 🔧

Criar um build de desenvolvimento customizado.

#### Passo a Passo:

1. **Instalar EAS CLI** (já deve ter):
   ```powershell
   npm install -g eas-cli
   ```

2. **Criar development build**:
   ```powershell
   cd mobile
   eas build --profile development --platform android
   ```

   **Nota**: Isso também conta como build, então pode ter o mesmo problema de limite.

---

## 🎯 Recomendação: Expo Go

**A melhor opção é usar Expo Go no celular**:

1. É gratuito
2. Funciona imediatamente
3. Testa no dispositivo real
4. Hot reload funciona
5. Próximo da experiência final

## 📋 Passo a Passo Completo (Expo Go)

### 1. Instalar Expo Go

- **Android**: Play Store > "Expo Go"
- **iOS**: App Store > "Expo Go"

### 2. Iniciar Servidor

```powershell
cd mobile
npm install  # Se ainda não instalou
npm start
```

### 3. Conectar Dispositivo

**Opção A: Mesma rede Wi-Fi**
- Certifique-se que celular e computador estão na mesma rede
- Escaneie o QR code que aparecer no terminal

**Opção B: Tunnel Mode**
- Pressione `s` no terminal
- Escolha "tunnel"
- Escaneie o QR code (funciona de qualquer rede)

### 4. Abrir no Expo Go

- Abra o app Expo Go no celular
- Escaneie o QR code
- O app carregará!

## 🎮 Testar Funcionalidades

Com o app rodando, você pode testar:

- ✅ Tela de Login
- ✅ Dashboard
- ✅ Navegação entre telas
- ✅ Layout e design
- ⚠️ Player de vídeo (pode ter limitações no Expo Go)
- ⚠️ Integração com API (precisa estar acessível)

## 🔧 Comandos Úteis

```powershell
# Iniciar servidor
cd mobile
npm start

# Modos disponíveis:
# - Pressione 'w' para web
# - Pressione 'a' para Android (se tiver emulador)
# - Pressione 'i' para iOS (se tiver Mac)
# - Pressione 's' para alternar tunnel
# - Pressione 'r' para recarregar
```

## 🐛 Problemas Comuns

### QR Code não aparece

**Solução**: Pressione `s` e escolha "tunnel"

### App não carrega

**Solução**: 
- Verifique se está na mesma rede Wi-Fi
- Ou use tunnel mode

### Erro de conexão

**Solução**:
- Verifique se o servidor está rodando
- Tente reiniciar: `npm start`

## 💡 Dica

**Use Expo Go no celular** - é a melhor forma de testar enquanto aguarda o build do APK!

## 📱 Testar em Android TV Box

Se você tem uma Android TV Box:

1. Instale Expo Go na TV Box
2. Use o mesmo processo (escanear QR code)
3. Funciona perfeitamente!

---

## 🎉 Resumo

**Enquanto aguarda os 16 dias**, você pode:

1. ✅ Testar no celular com Expo Go
2. ✅ Testar no navegador (web)
3. ✅ Testar em emulador (se tiver)
4. ✅ Fazer ajustes e melhorias
5. ✅ Adicionar assets (ícones, splash)

**Tudo funcionando perfeitamente!** 🚀

