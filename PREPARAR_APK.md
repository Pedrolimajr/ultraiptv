# 🎯 Preparar App para Gerar APK - Checklist Completo

## ✅ Status Atual

### Front-end Mobile
- ✅ **100% Pronto** - Todas as telas implementadas
- ✅ Login funcionando
- ✅ Dashboard completo
- ✅ Player de vídeo
- ✅ Integração com API externa
- ✅ Configurações
- ⚠️ Assets (ícones) - Placeholder (funciona sem, mas recomendado adicionar)

### Backend
- ✅ Funcionando
- ✅ API rodando
- ✅ Banco de dados configurado

### Painel Admin
- ✅ Funcionando
- ✅ Dashboard operacional

## 🚀 Próximos Passos para Gerar APK

### 1️⃣ Verificar Dependências do Mobile

```powershell
cd mobile
npm install
```

### 2️⃣ Testar App em Desenvolvimento (Recomendado)

```powershell
cd mobile
npm start
```

Teste todas as funcionalidades antes de gerar o APK.

### 3️⃣ (Opcional) Adicionar Assets

Crie ou adicione os seguintes arquivos em `mobile/assets/`:

- `icon.png` (1024x1024px)
- `adaptive-icon.png` (1024x1024px)
- `splash.png` (2048x2048px)
- `favicon.png` (48x48px)

**Nota**: O app funciona sem eles, mas é melhor adicionar.

### 4️⃣ Configurar EAS Build

```powershell
# Instalar EAS CLI (se ainda não instalou)
npm install -g eas-cli

# Login no Expo
eas login

# Configurar projeto
cd mobile
eas build:configure
```

### 5️⃣ Gerar APK

```powershell
cd mobile
eas build -p android --profile apk
```

## 📋 Checklist Final

### Antes de Gerar APK

- [ ] Dependências instaladas (`npm install` no mobile)
- [ ] App testado em desenvolvimento
- [ ] API externa configurada (`mobile/config/api.ts`)
- [ ] EAS CLI instalado
- [ ] Logado no Expo
- [ ] Projeto EAS configurado
- [ ] (Opcional) Assets adicionados

### Depois de Gerar APK

- [ ] APK baixado
- [ ] APK testado em dispositivo/emulador
- [ ] Instalado na TV
- [ ] Login funcionando
- [ ] Reprodução de vídeo funcionando

## 🎯 Comandos Rápidos

```powershell
# 1. Preparar
cd mobile
npm install

# 2. Testar (opcional)
npm start

# 3. Configurar EAS
eas login
eas build:configure

# 4. Gerar APK
eas build -p android --profile apk
```

## 📱 Instalação na TV

Depois de gerar o APK, consulte:
- `GUIA_SMART_TV.md` - Instalação detalhada
- `GERAR_APK.md` - Guia completo de build

## 🔧 Configurações Já Prontas

- ✅ `app.json` configurado
- ✅ `eas.json` configurado
- ✅ Package name: `com.ultraiptv.app`
- ✅ Orientação: Landscape (TV)
- ✅ Permissões: Internet, Network State, etc.
- ✅ API externa: `http://aguacomgas.shop`

## 💡 Resumo

**Front-end está 100% pronto!** 

Você só precisa:
1. Instalar EAS CLI
2. Fazer login no Expo
3. Gerar o APK
4. Instalar na TV

Tudo está configurado e funcionando! 🎉

