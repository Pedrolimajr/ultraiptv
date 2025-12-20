# 🔧 Solução: Erro no Build

## ❌ Erro Encontrado

```
Error: build command failed.
```

## 🔍 Possíveis Causas

### 1. Limite de Builds Gratuitos

Você viu esta mensagem:
```
This account has used its Android builds from the Free plan this month, which will reset in 16 days
```

**Solução**: Aguarde 16 dias OU faça upgrade do plano.

### 2. Erro no Código/Configuração

O build pode ter falhado por:
- Assets faltando (icon.png, splash.png)
- Erro de sintaxe
- Dependências incompatíveis

### 3. Problemas de Configuração

- `app.json` com configurações inválidas
- Dependências não instaladas corretamente

## ✅ Soluções

### Solução 1: Verificar Logs Detalhados

```powershell
cd mobile
eas build:list --limit=1
```

Isso mostra o último build e o link para ver os logs completos.

### Solução 2: Ver Logs Online

Acesse: https://expo.dev/accounts/filhopedro/projects/ultraiptv/builds

Clique no build que falhou para ver os logs detalhados.

### Solução 3: Criar Assets Placeholder

Se o erro for por assets faltando, crie placeholders:

```powershell
cd mobile/assets
# Crie arquivos placeholder ou use imagens simples
```

### Solução 4: Build Local (Alternativa)

Se o problema for limite de builds, tente build local:

```powershell
cd mobile
eas build -p android --profile apk --local
```

**Requisitos**:
- Android SDK instalado
- Java JDK
- Variáveis de ambiente configuradas

### Solução 5: Verificar Configuração

Verifique se o `app.json` está correto:

```powershell
cd mobile
npx expo-doctor
```

## 🔍 Diagnóstico

### Passo 1: Ver Logs

```powershell
cd mobile
eas build:list
```

### Passo 2: Ver Detalhes do Build

Acesse o link que aparecer ou:
https://expo.dev/accounts/filhopedro/projects/ultraiptv/builds

### Passo 3: Identificar Erro

Procure por:
- `ERROR`
- `FAILED`
- `Missing`
- `Cannot find`

## 🚀 Próximos Passos

### Se for Limite de Builds:

1. **Aguardar 16 dias** para reset
2. **OU fazer upgrade** do plano Expo
3. **OU fazer build local** (requer Android SDK)

### Se for Erro de Código:

1. Ver logs detalhados
2. Corrigir o erro
3. Tentar build novamente

## 📋 Checklist

- [ ] Ver logs detalhados do build
- [ ] Verificar se assets existem
- [ ] Verificar `app.json`
- [ ] Verificar dependências
- [ ] Verificar se há erros de sintaxe

## 💡 Dica

O erro mais comum é **assets faltando**. Crie placeholders simples ou adicione as imagens reais.

## 🆘 Ainda com Problemas?

1. Compartilhe os logs completos do build
2. Verifique o link: https://expo.dev/accounts/filhopedro/projects/ultraiptv/builds
3. Veja a mensagem de erro específica nos logs

