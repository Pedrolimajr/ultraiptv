# 🔍 Problema: Canais, Filmes e Séries Não Abrem

## 📋 Diagnóstico

O app está tentando buscar conteúdo da API externa `http://aguacomgas.shop`, mas pode haver problemas:

1. **CORS**: A API externa pode não permitir requisições do navegador
2. **Autenticação**: O token do backend local pode não ser aceito pela API externa
3. **Player Web**: O expo-av pode ter limitações no web para streams IPTV

## ✅ Melhorias Implementadas

1. **Tratamento de Erros Melhorado**: Agora mostra mensagens de erro claras
2. **Headers CORS**: Adicionado `mode: 'cors'` nas requisições
3. **Cache**: Usa cache quando disponível
4. **Player**: Melhorado carregamento do vídeo

## 🔧 Possíveis Soluções

### Opção 1: Verificar se a API Externa está Funcionando

Teste a API diretamente no navegador ou Postman (substitua pelos caminhos corretos do seu provedor):
- `http://aguacomgas.shop/live` (com token)
- `http://aguacomgas.shop/movies` (com token)
- `http://aguacomgas.shop/series` (com token)

Se o provedor utilizar caminhos diferentes (ex: `/api/channels`, `/api/vod`), defina as variáveis no `.env` do backend:
```
EXTERNAL_API_LIVE_PATH=api/channels
EXTERNAL_API_MOVIES_PATH=api/vod/movies
EXTERNAL_API_SERIES_PATH=api/vod/series
EXTERNAL_API_EPG_PATH=api/epg
```
Assim o proxy monta a URL correta sem precisar alterar código.

### Opção 2: Criar Proxy no Backend

Se a API externa não aceita CORS, podemos criar rotas no backend que fazem proxy:

```javascript
// backend/src/routes/content.js
router.get('/live', async (req, res) => {
  // Buscar da API externa e retornar
});
```

### Opção 3: Verificar Token

A API externa pode precisar de um token diferente. Verifique:
- Se o token do backend local funciona na API externa
- Se precisa fazer login na API externa separadamente

## 🧪 Como Testar

1. Abra o console do navegador (F12)
2. Vá para a aba "Network"
3. Tente acessar canais/filmes/séries
4. Veja quais requisições estão falhando
5. Verifique os erros no console

## 📝 Próximos Passos

1. Verificar erros no console do navegador
2. Testar a API externa diretamente
3. Se necessário, criar proxy no backend
4. Ajustar autenticação se necessário

