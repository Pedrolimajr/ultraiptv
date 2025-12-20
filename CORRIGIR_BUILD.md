# 🔧 Como Corrigir o Erro do Build

## ❌ Erro: "build command failed"

## 🔍 Verificar o Erro Real

### Opção 1: Ver Logs Online (Recomendado)

Acesse diretamente:
**https://expo.dev/accounts/filhopedro/projects/ultraiptv/builds**

1. Clique no build que falhou
2. Veja os logs completos
3. Procure por mensagens de erro (ERROR, FAILED, Missing)

### Opção 2: Ver no Terminal

```powershell
cd mobile
eas build:list
```

## 🚀 Soluções Mais Comuns

### Solução 1: Assets Faltando (Mais Comum)

**Erro típico**: `Cannot find module './assets/icon.png'`

**Solução**:

1. Crie imagens simples (mesmo que sejam placeholders):
   - `mobile/assets/icon.png` (1024x1024px)
   - `mobile/assets/adaptive-icon.png` (1024x1024px)
   - `mobile/assets/splash.png` (2048x2048px)

2. Ou remova temporariamente as referências no `app.json`:

```json
// Comentar temporariamente
// "icon": "./assets/icon.png",
```

### Solução 2: Limite de Builds Gratuitos

Você viu:
```
This account has used its Android builds from the Free plan this month
```

**Soluções**:
1. **Aguardar 16 dias** para reset
2. **Fazer upgrade** do plano Expo
3. **Build local** (requer Android SDK)

### Solução 3: Verificar Dependências

```powershell
cd mobile
npm install
npm run start  # Testar se funciona
```

### Solução 4: Verificar app.json

```powershell
cd mobile
npx expo-doctor
```

## 📋 Checklist de Verificação

- [ ] Ver logs detalhados online
- [ ] Verificar se assets existem
- [ ] Verificar dependências instaladas
- [ ] Verificar `app.json` válido
- [ ] Verificar se há erros de sintaxe

## 🎯 Próxima Tentativa

Depois de corrigir:

```powershell
cd mobile
eas build -p android --profile apk
```

## 💡 Dica

**O erro mais comum é assets faltando**. Crie imagens simples (pode ser um quadrado preto) e coloque em `mobile/assets/`.

## 🆘 Precisa de Ajuda?

1. Acesse: https://expo.dev/accounts/filhopedro/projects/ultraiptv/builds
2. Clique no build que falhou
3. Copie a mensagem de erro completa
4. Compartilhe para análise

