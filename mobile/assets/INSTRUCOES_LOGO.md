# 📝 Instruções para Adicionar a Logo

## ⚠️ Importante

O app está funcionando com o logo renderizado (texto + círculo). Para usar sua logo ULTRAPLAYER:

### 1. Adicione a logo em `mobile/assets/logo.png`

### 2. Edite `mobile/app/login.tsx`

No componente `LogoComponent()`, descomente estas linhas:

```typescript
const logoSource = require('../assets/logo.png');
return (
  <Image
    source={logoSource}
    style={styles.logoImage}
    resizeMode="contain"
  />
);
```

E comente ou remova o return atual com o logo renderizado.

### 3. Para usar como ícone do app

Adicione também:
- `icon.png` (1024x1024px) em `mobile/assets/`
- `adaptive-icon.png` (1024x1024px) em `mobile/assets/`
- `splash.png` (2048x2048px) em `mobile/assets/`

Depois, edite `mobile/app.json` e descomente as linhas:
- `"icon": "./assets/icon.png",`
- `"image": "./assets/splash.png",` (dentro de splash)
- `"foregroundImage": "./assets/adaptive-icon.png",` (dentro de adaptiveIcon)

