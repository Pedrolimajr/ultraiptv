# 🎨 Como Adicionar Sua Logo ULTRAPLAYER

## 📋 Passo a Passo

### 1. Adicione a Logo

Coloque sua logo ULTRAPLAYER na pasta `mobile/assets/` com o nome:
- **`logo.png`** (recomendado: 1024x1024px ou maior, PNG com fundo transparente)

### 2. Atualize o Código

Depois de adicionar a logo, edite o arquivo `mobile/app/login.tsx`:

1. Encontre a função `LogoComponent()` (linha ~19)
2. Descomente estas 3 linhas:
   ```typescript
   const logoSource = require('../assets/logo.png');
   if (logoSource && !imageError) {
   ```
3. Descomente também o bloco `return` com a `Image` (linhas seguintes)
4. Comente ou remova o `return` atual com o logo renderizado

### 3. Salve e Recarregue

Salve o arquivo e recarregue o app (pressione `r` no terminal ou F5 no navegador).

## ✅ Resultado

Depois desses passos, sua logo ULTRAPLAYER aparecerá na tela de login em vez do logo renderizado.

## 📝 Nota

Se você quiser usar a logo também como ícone do app:
- Adicione `icon.png` (1024x1024px)
- Adicione `adaptive-icon.png` (1024x1024px)  
- Adicione `splash.png` (2048x2048px)
- Descomente as linhas correspondentes no `app.json`














