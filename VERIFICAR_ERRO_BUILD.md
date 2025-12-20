# 🔍 Como Verificar o Erro do Build

## 📋 Passo a Passo

### 1. Ver Lista de Builds

```powershell
cd mobile
eas build:list
```

Isso mostra todos os builds e seus status.

### 2. Ver Logs Detalhados

Acesse diretamente:
**https://expo.dev/accounts/filhopedro/projects/ultraiptv/builds**

Clique no build que falhou para ver os logs completos.

### 3. Erros Comuns

#### Assets Faltando
```
Error: Cannot find module './assets/icon.png'
```

**Solução**: Crie os assets ou use placeholders.

#### Dependências
```
Error: Cannot find module 'xxx'
```

**Solução**: Execute `npm install` na pasta mobile.

#### Configuração
```
Error: Invalid app.json
```

**Solução**: Verifique o `app.json` com `npx expo-doctor`.

## 🚀 Próxima Tentativa

Depois de corrigir o erro:

```powershell
cd mobile
eas build -p android --profile apk
```

## 💡 Dica Rápida

O erro mais comum é **assets faltando**. O app funciona sem eles em desenvolvimento, mas o build pode falhar.

**Solução rápida**: Crie imagens simples (mesmo que sejam quadrados coloridos) e coloque em `mobile/assets/`.

