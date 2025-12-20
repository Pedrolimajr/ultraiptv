# 🚀 Guia Completo - Gerar APK do ULTRAIPTV

## 📋 Pré-requisitos

1. **Node.js** (v18 ou superior)
2. **Expo CLI** instalado globalmente
3. **EAS CLI** instalado
4. **Conta Expo** (gratuita)

---

## 🔧 Instalação

### 1. Instalar EAS CLI

```bash
npm install -g eas-cli
```

### 2. Login no Expo

```bash
eas login
```

### 3. Instalar Dependências

```bash
cd mobile
npm install
```

---

## 📦 Configuração do EAS Build

### 1. Configurar Projeto (se ainda não configurado)

```bash
cd mobile
eas build:configure
```

### 2. Verificar/Criar `eas.json`

O arquivo `eas.json` deve estar em `mobile/eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## 🏗️ Gerar APK

### Opção 1: APK de Preview (Recomendado para testes)

```bash
cd mobile
eas build -p android --profile preview
```

### Opção 2: APK de Produção

```bash
cd mobile
eas build -p android --profile production
```

### Opção 3: Build Local (mais rápido, requer Android SDK)

```bash
cd mobile
eas build -p android --profile preview --local
```

---

## ⏳ Processo de Build

1. **Upload do código**: O EAS faz upload do seu código
2. **Build na nuvem**: O build é feito nos servidores Expo
3. **Download**: Você recebe um link para download do APK

**Tempo estimado**: 10-20 minutos

---

## 📥 Download do APK

Após o build completar:

1. Acesse: https://expo.dev/accounts/[seu-usuario]/projects/ultraiptv/builds
2. Clique no build mais recente
3. Baixe o APK

---

## 🔐 Assinatura do APK

O APK gerado pelo EAS já vem assinado e pronto para instalação.

---

## 📱 Instalação

### Em Dispositivo Android:

1. Transfira o APK para o dispositivo
2. Ative "Fontes Desconhecidas" nas configurações
3. Abra o arquivo APK
4. Instale

### Em Android TV / Fire Stick:

1. Use `adb install` ou transfira via USB
2. Ou use um gerenciador de arquivos na TV

```bash
adb install -r path/to/app.apk
```

---

## 🎯 Correções Implementadas

### ✅ Player
- Tela cheia automática 100%
- Fallback robusto multi-camada
- Retry com backoff exponencial
- Compatível com Android TV/Fire Stick

### ✅ Performance
- Cache inteligente
- Lazy loading
- Otimizações de memória

### ✅ UI/UX
- Navegação TV (D-pad)
- Layout responsivo
- Animações suaves

### ✅ API/IPTV
- Parsing robusto
- Tratamento de erros
- Cache local

---

## 🐛 Troubleshooting

### Erro: "EAS CLI not found"
```bash
npm install -g eas-cli
```

### Erro: "Not logged in"
```bash
eas login
```

### Erro: "Project not configured"
```bash
cd mobile
eas build:configure
```

### Build falha
- Verifique os logs no dashboard do Expo
- Certifique-se de que todas as dependências estão instaladas
- Verifique se há erros de TypeScript/ESLint

---

## 📝 Notas Importantes

1. **Primeiro build**: Pode demorar mais (criação de credenciais)
2. **Builds subsequentes**: Mais rápidos (reutiliza credenciais)
3. **Limite gratuito**: Expo oferece builds gratuitos limitados
4. **APK size**: ~50-100MB (dependendo das dependências)

---

## 🔄 Atualizações Futuras

Para gerar nova versão:

1. Atualize `version` em `mobile/app.json`
2. Execute o build novamente:
```bash
cd mobile
eas build -p android --profile preview
```

---

## 📞 Suporte

- **Documentação Expo**: https://docs.expo.dev
- **EAS Build Docs**: https://docs.expo.dev/build/introduction/
- **Expo Discord**: https://chat.expo.dev

---

**Última atualização**: $(date)
**Versão do App**: 1.0.0

