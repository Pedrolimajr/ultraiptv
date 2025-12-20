# 🎨 Como Adicionar a Logo ULTRAPLAYER

## 📋 Instruções

Você precisa adicionar a logo ULTRAPLAYER que você anexou nos seguintes locais:

### 📱 Mobile App (`mobile/assets/`)

Adicione a logo com os seguintes nomes e tamanhos:

1. **`logo.png`** - Logo principal
   - Tamanho recomendado: 1024x1024px ou maior
   - Formato: PNG com fundo transparente
   - Usado na tela de login

2. **`icon.png`** - Ícone do app
   - Tamanho: 1024x1024px
   - Formato: PNG
   - Usado como ícone do aplicativo na instalação

3. **`adaptive-icon.png`** - Ícone adaptativo Android
   - Tamanho: 1024x1024px
   - Formato: PNG
   - Usado no Android como ícone adaptativo

4. **`splash.png`** - Tela de splash/loading
   - Tamanho: 2048x2048px ou maior
   - Formato: PNG
   - Fundo: Preto (#000000) com logo centralizado
   - Usado na tela de carregamento inicial

### 🎛️ Admin Panel (`admin/public/assets/`)

Adicione a logo com o nome:

1. **`logo.png`** - Logo do painel admin
   - Tamanho recomendado: 512x512px ou maior
   - Formato: PNG com fundo transparente
   - Usado na tela de login do admin

## 📁 Estrutura de Pastas

```
ultraiptv/
├── mobile/
│   └── assets/
│       ├── logo.png          ← Adicione aqui
│       ├── icon.png          ← Adicione aqui (mesma logo)
│       ├── adaptive-icon.png ← Adicione aqui (mesma logo)
│       └── splash.png        ← Adicione aqui (logo em fundo preto)
│
└── admin/
    └── public/
        └── assets/
            └── logo.png      ← Adicione aqui
```

## ✅ Checklist

- [ ] Adicionar `logo.png` em `mobile/assets/`
- [ ] Adicionar `icon.png` em `mobile/assets/` (pode ser a mesma imagem)
- [ ] Adicionar `adaptive-icon.png` em `mobile/assets/` (pode ser a mesma imagem)
- [ ] Adicionar `splash.png` em `mobile/assets/` (logo em fundo preto)
- [ ] Adicionar `logo.png` em `admin/public/assets/`

## 💡 Dicas

1. **Para o ícone do app**: Use a mesma logo, mas certifique-se de que fica bem em formato quadrado
2. **Para o splash**: Coloque a logo centralizada em um fundo preto (#000000)
3. **Formato**: PNG é recomendado para manter qualidade e transparência
4. **Tamanho**: Use imagens grandes (1024x1024px ou maior) - o sistema redimensiona automaticamente

## 🚀 Após Adicionar

Depois de adicionar as imagens:

1. **Mobile**: O app já está configurado para usar as imagens
2. **Admin**: Reinicie o servidor do admin (`npm run dev` na pasta admin)

## 📝 Nota

Se você tiver apenas uma versão da logo, pode usar a mesma imagem para todos os arquivos. O sistema vai redimensionar conforme necessário.

