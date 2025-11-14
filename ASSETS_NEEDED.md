# 🎨 Assets Necessários

Este arquivo lista todos os assets (imagens, ícones) que você precisa adicionar ao projeto.

## 📱 Mobile App (`mobile/assets/`)

### Ícones Obrigatórios

1. **icon.png**
   - Tamanho: 1024x1024px
   - Formato: PNG
   - Fundo: Transparente ou sólido
   - Descrição: Ícone principal do app

2. **adaptive-icon.png**
   - Tamanho: 1024x1024px
   - Formato: PNG
   - Fundo: Sólido (recomendado)
   - Descrição: Ícone adaptativo para Android

3. **splash.png**
   - Tamanho: 2048x2048px (ou maior)
   - Formato: PNG
   - Fundo: Preto (#000000) ou gradiente escuro
   - Descrição: Tela de splash/loading
   - Sugestão: Logo ULTRAIPTV centralizado

4. **favicon.png**
   - Tamanho: 48x48px (ou múltiplos tamanhos)
   - Formato: PNG
   - Descrição: Favicon para web (opcional)

### Logo ULTRAIPTV

O logo é renderizado via código no app, mas você pode criar uma imagem se preferir:

- **logo.png** (opcional)
  - Tamanho: 512x512px ou maior
  - Formato: PNG com fundo transparente
  - Descrição: Logo do ULTRAIPTV

### Fontes (Opcional)

- **SpaceMono-Regular.ttf**
  - Localização: `mobile/assets/fonts/`
  - Descrição: Fonte customizada (opcional, o app usa fontes do sistema)

## 🎨 Design do Logo

Baseado na descrição fornecida, o logo deve ter:

- **Círculo externo**: Borda neon cyan (#00D9FF) com glow
- **Botão play central**: Gradiente de cyan para roxo/magenta
- **Elementos abstratos**: Linhas e formas geométricas em neon
- **Texto**: "ULTRAIPTV" em prata metálica
- **Fundo**: Preto sólido

### Cores do Logo

- Cyan: `#00D9FF`
- Roxo/Magenta: `#8B5CF6` ou `#9B59B6`
- Prata: `#C0C0C0` ou `#E8E8E8`
- Preto: `#000000`

## 🛠️ Ferramentas Recomendadas

Para criar os assets:

- **Figma** - Design gráfico
- **Adobe Illustrator** - Vetores
- **Photoshop** - Edição de imagens
- **Canva** - Design rápido
- **GIMP** - Alternativa gratuita

## 📐 Especificações Técnicas

### Ícone do App

- **Formato**: PNG 24-bit
- **Tamanho**: 1024x1024px (mínimo)
- **Fundo**: Preferencialmente transparente
- **Área segura**: 80% central (evitar elementos nas bordas)

### Splash Screen

- **Formato**: PNG
- **Tamanho**: 2048x2048px ou maior
- **Fundo**: Preto (#000000) ou gradiente escuro
- **Conteúdo**: Logo centralizado
- **Orientação**: Landscape (para TV)

## 🎯 Checklist

- [ ] icon.png (1024x1024px)
- [ ] adaptive-icon.png (1024x1024px)
- [ ] splash.png (2048x2048px)
- [ ] favicon.png (48x48px) - opcional
- [ ] logo.png (512x512px) - opcional

## 💡 Dicas

1. **Mantenha consistência**: Use as mesmas cores e estilo em todos os assets
2. **Teste em diferentes tamanhos**: Os ícones serão redimensionados
3. **Use alta resolução**: Melhor ter imagens grandes e deixar o sistema redimensionar
4. **Fundo transparente**: Para ícones, use PNG com transparência
5. **Preview**: Teste como os ícones aparecem no dispositivo antes de publicar

## 🔄 Atualizar Assets

Após adicionar os arquivos:

1. Coloque-os na pasta `mobile/assets/`
2. Verifique se os nomes estão corretos
3. Execute `npm start` no mobile para testar
4. Gere o APK para ver como ficam no dispositivo final

## 📝 Nota

O app funciona sem os assets (usa placeholders), mas é **altamente recomendado** adicionar os assets reais antes de gerar o APK final para produção.

