# Guia: Testar no Emulador e Gerar APK

## Status do Projeto
✅ Dependências instaladas com `pnpm` (903 pacotes, sem erros críticos)  
✅ Código fonte pronto (cache, watchdog, NetworkStatus integrados)  
✅ API de canais apontada para `http://aguacomgas.shop/live`  
⚠️ Pronto para testar no emulador Android ou Expo Go

---

## Parte 1: Testar no Emulador Android (Recomendado)

### Pré-requisitos
Você precisa ter instalado no seu PC:
- **Android Studio** (com Android SDK 31+)
- **Android SDK Platform Tools** (`adb` no PATH)
- **Java JDK 11+** (pode ser gerenciado pelo Android Studio)
- **Um AVD (Android Virtual Device) criado** (ex: Pixel 4 API 30)

#### Verificar se está tudo pronto
```powershell
adb version
adb devices
java -version
```

Se algum comando não funcionar, instale/configure no Android Studio.

---

### Passo 1: Iniciar o Emulador Android
```powershell
# Listar AVDs disponíveis
emulator -list-avds

# Iniciar um emulador (ex: Pixel_4_API_30)
emulator -avd Pixel_4_API_30
```

Aguarde 30-60s até o emulador aparecer na tela.

---

### Passo 2: Iniciar Metro/Expo
Em outro terminal PowerShell (mantenha o emulador rodando):
```powershell
cd 'C:\Junior\ultraiptv\mobile'

# Use pnpm para rodar o script start
pnpm start
```

Ou se preferir usar npm (agora funciona com as dependências corretas):
```powershell
npm start
```

**O que vai aparecer:**
- Metro bundler inicializará (processa JavaScript)
- Após ~30-60s, você verá um menu com opções: `a` (Android), `i` (iOS), `w` (Web), etc.
- Aguarde as mensagens de "Connected" (significa que o Metro conectou ao emulador)

---

### Passo 3: Instalar e Rodar no Emulador
No terminal com Metro rodando, pressione:
```
a
```

Isso vai:
1. Compilar o projeto para Android
2. Instalar o app no emulador conectado
3. Abrir o app automaticamente no emulador

**Primeira compilação pode demorar 2-5 minutos.** Veja logs no terminal.

---

### Passo 4: Navegar e Testar
Assim que o app abrir no emulador:
1. **Faça login** (se tiver credenciais)
2. Navegue para **"LIVE TV"** ou **"Canais ao Vivo"**
3. Confirme se **a lista de canais aparece** (deve vir de cache ou do servidor)
4. Clique em um canal para testar o **player**
5. Confirme se **o banner de "Sem internet"** aparece quando offline

#### Dicas de Navegação no Emulador
- Mouse: clique normal
- Teclado: use as setas e Enter
- Voltar: tecla `Esc`

---

## Parte 2: Testar com Expo Go (Alternativa Rápida)

Se não tiver Android Studio configurado, pode usar Expo Go (mais simples, menos setup):

### Passo 1: Instalar Expo Go
- Baixe "Expo Go" de: https://play.google.com/store/apps/details?id=host.exp.exponent
- Ou use ele em um emulador (play store do emulador)

### Passo 2: Rodar Metro
```powershell
cd 'C:\Junior\ultraiptv\mobile'
pnpm start
```

### Passo 3: Conectar pelo QR Code
- No emulador, abra Expo Go
- Pressione "Scan QR Code"
- Aponte a câmera (ou simule) para o QR que aparece no terminal
- O app vai instalar automaticamente

---

## Parte 3: Gerar APK para Instalar na TV

### Opção A: Usar EAS Build (Recomendado - Nuvem)

#### Pré-requisitos
- Conta Expo (criar em: https://expo.dev)
- EAS CLI instalado

#### Passo 1: Instalar EAS CLI
```powershell
npm install -g eas-cli
```

#### Passo 2: Login
```powershell
eas login
```

Você será redirecionado para o navegador para fazer login.

#### Passo 3: Gerar APK
```powershell
cd 'C:\Junior\ultraiptv\mobile'
eas build -p android --profile production
```

**O que vai acontecer:**
- Será feito upload do código para a nuvem Expo
- Será compilado um APK de release
- Após 5-10 minutos, você receberá um link para baixar o APK
- Você também pode usar: `eas build:list` para ver builds anteriores

#### Passo 4: Baixar e Instalar no Emulador/Dispositivo
```powershell
# Se tiver o APK local
adb install -r .\ultraiptv-app-release.apk

# Ou se estiver no emulador
adb -s emulator-5554 install -r .\ultraiptv-app-release.apk
```

---

### Opção B: Build Local com Gradle (Offline)

Se preferir compilar localmente (requer Android NDK + Gradle):

```powershell
cd 'C:\Junior\ultraiptv\mobile'

# Gerar APK local (pode demorar 10-20 minutos)
eas build --local -p android --profile production
```

Requer mais setup (Android NDK, Gradle), mas não precisa fazer upload.

---

## Parte 4: Instalar APK em TV Android

Depois que gerar o APK (`ultraiptv-app-release.apk`):

### Opção A: Usando `adb` (se TV estiver conectada via USB)
```powershell
adb connect <IP_DA_TV>:5555    # Se estiver na mesma rede
adb install -r .\ultraiptv-app-release.apk
```

### Opção B: Transferir para USB e instalar manualmente
1. Copie o APK para um pen-drive ou cartão SD
2. Plugue na TV
3. Use o gerenciador de arquivos da TV para abrir o APK
4. Confirme a instalação

### Opção C: Usar uma ferramenta gráfica
- **Android Studio** → Device Manager → Instalar APK via UI
- **ADB AppControl** (app gráfico no Windows)

---

## Diagnosticar Problemas

### Se o Metro não iniciar
```powershell
# Limpar cache e tentar novamente
pnpm start --clear
```

### Se o app crasha no emulador
```powershell
# Ver logs em tempo real
adb logcat *:S ReactNative:V ReactNativeJS:V
```

### Se a lista de canais não aparece
- Verifique se o servidor `http://aguacomgas.shop/live` está online
- Confirme se há credenciais/token válidas no app (fazer login)
- Abra Developer Console no Metro e veja erros de rede

### Se o APK não instala na TV
```powershell
# Confirmar que a TV está conectada
adb devices

# Se não aparecer, verificar:
# 1. TV e PC na mesma rede
# 2. Ativar USB Debug na TV (Settings > Developer Options)
# 3. Tentar reconectar: adb kill-server; adb connect <IP_TV>:5555
```

---

## Comandos Úteis (Resumo)

```powershell
# No diretório mobile

# Iniciar Metro (desenvolvimento)
pnpm start

# Compilar e instalar no emulador
pnpm start          # Depois pressione 'a'

# Limpar cache
pnpm start --clear

# Ver logs do Expo
pnpm start --verbose

# Verificar emulador conectado
adb devices

# Instalar APK manualmente
adb install -r .\app-release.apk

# Desinstalar app
adb uninstall com.ultraiptv.app

# Reset completo (limpar cache, rebuild)
pnpm start -c --clear
```

---

## Próximos Passos

1. ✅ **Testar no Emulador** (siga Parte 1)
2. ✅ **Gerar APK** (siga Parte 3)
3. 📺 **Instalar na TV** (siga Parte 4)
4. 🔧 Se houver bugs, cole os logs e eu ajudo a corrigir

---

## Resumo: O Que Funciona Agora

| Funcionalidade | Status | Notas |
|---|---|---|
| Cache de Canais | ✅ | TTL 10 min, salvo em AsyncStorage |
| Watchdog/Retry | ✅ | Max 3 tentativas de reprodução |
| NetworkStatus | ✅ | Banner vermelho quando offline |
| API de Canais | ✅ | Apontada para `aguacomgas.shop/live` |
| Login | ✅ | Esperando credenciais válidas |
| Player | ✅ | Suporta m3u8, rtmp, etc. (expo-av) |
| Responsividade | ⚠️ | Landscape fixo (bom para TV), mas sem otimizações TV específicas |

---

**Pronto?** Execute o Passo 1 e começa a testar no emulador!
