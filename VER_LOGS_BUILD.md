# 🔍 Como Ver os Logs Detalhados do Build

## ❌ Erro: "build command failed"

Para descobrir o erro real, você precisa ver os **logs completos**.

## ✅ Solução: Ver Logs Online

### Passo 1: Acessar Dashboard do Expo

Acesse diretamente:
**https://expo.dev/accounts/filhopedro/projects/ultraiptv/builds**

### Passo 2: Ver o Build que Falhou

1. Clique no build mais recente (que falhou)
2. Veja os logs completos
3. Procure por:
   - `ERROR`
   - `FAILED`
   - `Missing`
   - `Cannot find`
   - `Error:`

### Passo 3: Identificar o Erro

Os erros mais comuns são:
- Dependências faltando
- Erro de sintaxe no código
- Configuração incorreta
- Assets faltando (já corrigimos isso)

## 🔧 Verificar Problemas Comuns

### 1. Verificar Dependências

```powershell
cd mobile
npm install
```

### 2. Verificar Código

```powershell
cd mobile
npm run start
```

Se der erro, corrija antes de fazer build.

### 3. Verificar app.json

```powershell
cd mobile
npx expo-doctor
```

## 📋 Compartilhe o Erro

Depois de ver os logs, compartilhe:
1. A mensagem de erro completa
2. Em que etapa falhou (compilação, build, etc.)

## 🚀 Alternativa: Build Local

Se o problema for limite de builds, tente build local:

```powershell
cd mobile
eas build -p android --profile apk --local
```

**Requisitos**:
- Android SDK instalado
- Java JDK
- Variáveis de ambiente configuradas

## 💡 Dica

O erro real está nos logs online. Sem ver os logs, é difícil saber o que corrigir.

