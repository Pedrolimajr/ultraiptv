# PRÓXIMOS PASSOS - Testes e Deploy

## ✅ O Que Está Pronto

### Infraestrutura
- ✅ Dependências instaladas com `pnpm` (903 pacotes)
- ✅ Metro bundler pronto
- ✅ Configuração Expo + EAS
- ✅ Scripts PowerShell para facilitar

### Código
- ✅ API de canais apontada para `http://aguacomgas.shop/live`
- ✅ Cache de canais (TTL 10 min)
- ✅ Watchdog + Retry automático
- ✅ NetworkStatus banner (offline)
- ✅ Responsividade dinâmica para TV (numColumns adaptável)

---

## 🚀 Comece Aqui (3 Passos)

### Passo 1: Iniciar Emulador Android (30 segundos)
```powershell
PowerShell -ExecutionPolicy Bypass -File .\scripts\start-emulator.ps1
```

Aguarde até aparecer a tela do Android (pode levar 1-2 minutos).

---

### Passo 2: Abrir outro terminal e rodar Metro (em paralelo)
```powershell
PowerShell -ExecutionPolicy Bypass -File .\scripts\start-metro.ps1
```

Aguarde a mensagem: "Ready to accept connections" (significa Metro pronto).

---

### Passo 3: Pressione 'a' no terminal do Metro
```
a
```

Metro vai:
1. Compilar o JavaScript
2. Instalar no emulador
3. Abrir o app automaticamente

**Primeira compilação: 2-5 minutos**. Aguarde.

---

## 📱 Testar no App

1. **Tela de Login**: Faça login (ou continue como guest se permitido)
2. **Dashboard**: Veja a home com opções (LIVE TV, Filmes, Séries, etc.)
3. **LIVE TV**: Clique e veja lista de canais (cache + api)
4. **Clicar em canal**: Deve abrir player
5. **Player**: Tente play/pause, feche com botão voltar

---

## 🔍 Testar Funcionalidades Específicas

### ✓ Cache de Canais
- Primeira vez: busca da API
- Segunda vez (< 10 min): usa cache (aparece instantaneamente)
- Após 10 min: busca novamente

### ✓ Watchdog + Retry
- Clique num canal e espere carregar
- Se der erro de stream, vai tentar até 3 vezes automaticamente

### ✓ NetworkStatus Banner
- Desplugue o WiFi (ou simule offline no emulador)
- Banner vermelho "Sem internet" deve aparecer no topo

---

## 📦 Gerar APK para TV

Depois de confirmar que funciona no emulador:

### Opção A: Build na Nuvem (EAS) - Recomendado
```powershell
# Se não tiver, instale EAS CLI
npm install -g eas-cli

# Faça login
eas login

# Gere APK
cd 'C:\Junior\ultraiptv\mobile'
eas build -p android --profile production
```

Você receberá um link para baixar o APK após 5-10 minutos.

### Opção B: Build Local
```powershell
cd 'C:\Junior\ultraiptv\mobile'
eas build --local -p android --profile production
```

Requer Android NDK, pode demorar 15-30 minutos.

---

## 📺 Instalar APK na TV

Depois de gerar (`ultraiptv-app-release.apk`):

```powershell
# Se TV está conectada via USB Debug
adb install -r .\ultraiptv-app-release.apk

# Ou transferir para pen-drive e instalar manualmente
```

---

## 🐛 Se Algo Quebrar

### Metro não inicia
```powershell
pnpm start --clear
```

### App crasha no emulador
```powershell
adb logcat *:S ReactNative:V ReactNativeJS:V
```

### Lista de canais não aparece
- Verifique se `aguacomgas.shop` está online
- Confirme se fez login (se requerido)
- Veja logs do Metro para erros de rede

### Emulador não aparece em `adb devices`
```powershell
adb kill-server
adb start-server
adb devices
```

---

## 📋 Resumo de Funcionalidades

| Feature | Status | Notas |
|---------|--------|-------|
| Login | ✅ JWT/Credenciais | Esperando setup de credenciais |
| Lista de Canais | ✅ Cache + API | `aguacomgas.shop/live` |
| Player IPTV | ✅ expo-av | m3u8, rtmp, http streams |
| Retry/Watchdog | ✅ 3 tentativas | Automático |
| NetworkStatus | ✅ Banner offline | Vermelho no topo |
| Responsividade TV | ✅ Landscape fixo | numColumns dinâmico |
| Filmes/Séries | ✅ Placeholders | Funcional se API fornece dados |
| Admin Backend | ✅ Separado | Acesso via web admin/ |

---

## ⏭️ Próximos (Depois de Validar)

1. Aumentar tamanho de botões/fontes para controle remoto TV
2. Testar com dados reais de canais do `aguacomgas.shop`
3. Ajustar cores/UI conforme preferência
4. Publicar APK em loop (modo TV/launcher)
5. Configurar auto-play/watchdog mais agressivo para TV

---

## 📞 Debug Rápido

```powershell
# Listar dispositivos/emuladores
adb devices

# Ver logs
adb logcat

# Reinstalar app no emulador
adb uninstall com.ultraiptv.app
adb install -r .\app-release.apk

# Conectar emulador por rede (se desconectou)
adb connect 127.0.0.1:5555

# Reset de dados do app
adb shell pm clear com.ultraiptv.app
```

---

**Pronto? Execute os 3 passos acima e comece a testar!**
