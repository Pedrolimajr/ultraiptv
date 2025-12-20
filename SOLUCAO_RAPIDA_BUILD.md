# ⚡ Solução Rápida: Erro no Build

## 🔍 Problema Identificado

O `app.json` está referenciando assets que **não existem**:
- `icon.png`
- `splash.png`
- `adaptive-icon.png`
- `favicon.png`

## ✅ Solução Rápida (2 Opções)

### Opção 1: Criar Assets Placeholder (Recomendado)

Crie imagens simples (pode ser um quadrado preto) e coloque em `mobile/assets/`:

1. **icon.png** - 1024x1024px (quadrado preto ou com logo)
2. **adaptive-icon.png** - 1024x1024px (mesmo que icon.png)
3. **splash.png** - 2048x2048px (fundo preto com logo centralizado)
4. **favicon.png** - 48x48px (opcional)

**Ferramentas**:
- Paint (Windows)
- GIMP (gratuito)
- Canva (online)
- Qualquer editor de imagens

### Opção 2: Remover Referências Temporariamente

Edite `mobile/app.json` e comente as linhas:

```json
{
  "expo": {
    // "icon": "./assets/icon.png",  // Comentado
    "splash": {
      // "image": "./assets/splash.png",  // Comentado
      "resizeMode": "contain",
      "backgroundColor": "#000000"
    },
    "android": {
      "adaptiveIcon": {
        // "foregroundImage": "./assets/adaptive-icon.png",  // Comentado
        "backgroundColor": "#000000"
      }
    }
  }
}
```

## 🚀 Depois de Corrigir

```powershell
cd mobile
eas build -p android --profile apk
```

## 💡 Dica

**Opção 1 é melhor** porque o app terá ícones. Mesmo que sejam simples, é melhor que nada.

## 📋 Checklist

- [ ] Assets criados OU referências comentadas
- [ ] `app.json` salvo
- [ ] Tentar build novamente

