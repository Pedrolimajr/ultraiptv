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

### 4️⃣ Gerar APK

```powershell
cd mobile
eas build -p android --profile apk
```

**Opções de build:**
- `--profile apk` - APK para instalação direta (recomendado)
- `--profile preview` - APK de preview
- `--profile production` - APK de produção

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

## 🎯 Instalar na TV

### Método 1: Via Pendrive/USB

1. Copie o APK para um pendrive
2. Conecte na TV
3. Na TV: Configurações > Segurança > Permitir fontes desconhecidas
4. Abra o gerenciador de arquivos
5. Navegue até o pendrive
6. Clique no APK para instalar

### Método 2: Via ADB

```powershell
# Conectar TV
adb connect IP_DA_TV:5555

# Instalar APK
adb install ultraiptv.apk
```

### Método 3: Via Downloader (FireStick)

1. Instale o app "Downloader" na FireStick
2. Baixe o APK em um serviço de hospedagem
3. Use o Downloader para baixar e instalar

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

