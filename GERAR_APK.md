# 📱 Guia Completo: Gerar APK para Instalar na TV

## ✅ Status do Front-end

O front-end está **100% pronto** com todas as funcionalidades:
- ✅ Login
- ✅ Dashboard
- ✅ Player de vídeo
- ✅ Canais ao vivo
- ✅ Filmes
- ✅ Séries
- ✅ Configurações
- ✅ Integração com API externa

## 🚀 Passo a Passo para Gerar APK

### 1️⃣ Preparar Ambiente

#### Instalar EAS CLI

```powershell
npm install -g eas-cli
```

#### Login no Expo

```powershell
eas login
```

Se não tiver conta, crie em: https://expo.dev/signup

### 2️⃣ Configurar Projeto EAS

```powershell
cd mobile
eas build:configure
```

Isso vai:
- Criar/atualizar `eas.json`
- Configurar o projeto no Expo

### 3️⃣ (Opcional) Adicionar Assets

Antes de gerar o APK, é recomendado adicionar os assets:

**Arquivos necessários em `mobile/assets/`:**
- `icon.png` (1024x1024px) - Ícone do app
- `adaptive-icon.png` (1024x1024px) - Ícone adaptativo
- `splash.png` (2048x2048px) - Tela de splash

**Nota**: O app funciona sem eles, mas é melhor adicionar antes do build final.

### 4️⃣ Gerar APK / AAB (EAS)

Opções recomendadas:
- Para **teste rápido** (APK):

```powershell
cd mobile
# substitua pelo IP da sua máquina onde o backend roda: http://192.168.0.123:3001
# 1) usando a variável de ambiente diretamente no comando
eas build -p android --profile preview --env EXPO_PUBLIC_BACKEND_URL="http://192.168.0.123:3001"
# ou 2) atualizando `mobile/eas.json` no campo `preview.env.EXPO_PUBLIC_BACKEND_URL`

# também existe um script npm conveniente
npm run eas:build:preview
```

- Para **produção / publicação Play Store** (AAB recomendado):

```powershell
cd mobile
# alterar profile `production` para gerar AAB (já configurado em eas.json)
# (substitua o BACKEND pela URL pública ou IP acessível pela rede)
eas build -p android --profile production --env EXPO_PUBLIC_BACKEND_URL="http://seu-backend-publico:3001"
# ou via npm script
npm run eas:build:production
```

**Opções de build:**
- `--profile apk` - APK para instalação direta (perfil `apk` está disponível)
- `--profile preview` - APK de preview (interno, rápido)
- `--profile production` - AAB (app bundle) configurado para produção (recomendado para Play Store)

### 5️⃣ Aguardar Build

O build será feito na nuvem (Expo). Você verá:
- Progresso do build
- Link para acompanhar: https://expo.dev/accounts/[seu-usuario]/builds

**Tempo estimado**: 10-20 minutos

### 6️⃣ Download do APK

Quando o build terminar:
1. Você receberá um link para download
2. Ou acesse: https://expo.dev/accounts/[seu-usuario]/builds
3. Baixe o arquivo `.apk`

## 📦 Build Local (Alternativa)

Se preferir build local (mais rápido, mas requer Android SDK):

```powershell
cd mobile
eas build -p android --profile apk --local
```

**Requisitos**:
- Android SDK instalado
- Java JDK
- Variáveis de ambiente configuradas

## 🎯 Instalar na TV / Dispositivo

### Credenciais e Assinatura (keystore)
- O EAS pode **gerenciar automaticamente** a assinatura do aplicativo (recomendado para simplicidade). Durante o primeiro build, escolha a opção `Let EAS manage credentials` quando solicitada.
- Se preferir usar seu próprio keystore, gere com o `keytool` (ou siga as instruções do Play Console) e faça upload via:

```powershell
# listar perfis de credenciais
eas credentials -p android

# ou usar a interface de upload interativa durante eas build
```

> Dica: use `eas credentials` para exportar/baixar e manter backups do keystore.

---

### Método 1: Via Pendrive/USB
1. Copie o APK para um pendrive
2. Conecte na TV
3. Na TV: Configurações > Segurança > Permitir fontes desconhecidas
4. Abra o gerenciador de arquivos
5. Navegue até o pendrive
6. Clique no APK para instalar

### Método 2: Via ADB (recomendado para testes)
1. Habilite **ADB Debugging** nas configurações de desenvolvedor da TV (ou celular).
2. Conecte via rede (TV e sua máquina na mesma rede):

```powershell
# conectar via rede (exemplo)
adb connect 192.168.0.55:5555

# instalar APK (substitua pelo caminho do arquivo baixado)
adb install -r .\ultraiptv.apk
```

3. Para listar logs de dispositivo (útil para debug):

```powershell
adb logcat | Select-String "ULTRAIPTV" -Context 1,1
```

### Método 3: Via Downloader (FireStick)
1. Instale o app "Downloader" na FireStick
2. Faça o upload do APK para um link público (ex: Google Drive, S3, ou um servidor simples)
3. Use o Downloader para baixar e instalar

---

### Expor backend local (quando estiver em Docker local)
- Se seu backend estiver rodando apenas localmente, use uma das opções abaixo para que o app no dispositivo consiga acessá-lo:
  - Usar IP da sua máquina na rede local (ex: `http://192.168.0.123:3001`) e passar para `EXPO_PUBLIC_BACKEND_URL` no build (ver seção acima).
  - Usar ngrok (ou similar) para criar uma URL pública temporária:

```powershell
# exemplo (instale ngrok antes)
ngrok http 3001
# use a URL retornada pelo ngrok como EXPO_PUBLIC_BACKEND_URL
```

> Observação: verifique se o endpoint resolvido aparece saudável em `http://<URL>:3001/` antes de rodar o build.

## 🔧 Configurações Importantes

### app.json

O `app.json` já está configurado com:
- ✅ Package: `com.ultraiptv.app`
- ✅ Orientação: Landscape (para TV)
- ✅ Permissões necessárias
- ✅ Intent filters para streaming

### API Externa

A API externa já está configurada em `mobile/config/api.ts`:
- URL: `http://aguacomgas.shop`

## 📋 Checklist Antes do Build

- [ ] EAS CLI instalado (`eas --version`)
- [ ] Logado no Expo (`eas login`)
- [ ] Projeto configurado (`eas build:configure`)
- [ ] Assets adicionados (opcional, mas recomendado)
- [ ] API externa configurada corretamente
- [ ] Testado em desenvolvimento (`npm start`)

## 🐛 Problemas Comuns

### Erro: "No EAS project ID found"

**Solução**:
```powershell
cd mobile
eas build:configure
```

### Erro: "Not logged in"

**Solução**:
```powershell
eas login
```

### Build falha

**Solução**:
1. Verifique os logs no Expo
2. Verifique se todas as dependências estão instaladas
3. Tente build local para ver erros detalhados

### APK muito grande

**Solução**:
- Use `--profile production` para otimização
- Remova assets desnecessários
- Use ProGuard (configurado automaticamente)

## 📚 Documentação Adicional

- `GUIA_SMART_TV.md` - Instalação detalhada na TV
- `ASSETS_NEEDED.md` - Assets necessários
- `mobile/README.md` - Documentação do app mobile

## 🎉 Pronto!

Depois de gerar o APK, você terá um arquivo instalável que pode ser usado em:
- ✅ Smart TVs Android
- ✅ Android TV Box
- ✅ Fire TV Stick
- ✅ Dispositivos Android

## 💡 Dicas

1. **Teste primeiro**: Teste o app em desenvolvimento antes de gerar APK
2. **Versão**: Atualize a versão no `app.json` antes de cada build
3. **Assets**: Adicione os assets antes do build final
4. **Backup**: Mantenha backups dos APKs gerados

