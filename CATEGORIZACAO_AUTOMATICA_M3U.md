# Categorização Automática de Conteúdo M3U

## Visão Geral

O sistema agora suporta **categorização automática** de conteúdo IPTV a partir de playlists M3U. Quando você fornece uma URL M3U (ou uma URL base que gera M3U), o sistema:

1. **Parseia** a playlist M3U
2. **Categoriza** automaticamente o conteúdo baseado em metadados
3. **Distribui** o conteúdo nas seções corretas (Live TV, Filmes, Séries)

## Como Funciona

### 1. Detecção Automática de Tipo de URL

O sistema detecta automaticamente se a URL fornecida é:
- **M3U**: URLs contendo `.m3u`, `get.php`, `playlist.m3u`
- **API Xtream**: URLs contendo `player_api.php` ou `player_api`

Se o tipo não for detectado, o sistema tenta M3U primeiro (mais comum).

### 2. Parsing M3U

O parser M3U extrai:
- **Metadados**: `tvg-id`, `tvg-name`, `tvg-logo`, `group-title`
- **Informações do canal**: Nome, URL de stream, logo
- **Categorização**: Baseada no `group-title`

### 3. Categorização Automática

A categorização é feita baseada no campo `group-title` da playlist M3U:

#### Canais ao Vivo (Live TV)
- **Padrão**: Se não houver palavras-chave de filmes ou séries
- **Palavras-chave detectadas**: `live`, `tv`, `canal`, `channel`, `ao vivo`, `sport`, `esporte`, `news`, `music`, etc.

#### Filmes (Movies)
- **Palavras-chave**: `movie`, `filme`, `cinema`, `film`, `vod`, `video on demand`
- **Exemplos de group-title**:
  - `Movies`
  - `Filmes`
  - `VOD`
  - `Video on Demand`

#### Séries (Series)
- **Palavras-chave**: `series`, `série`, `serie`, `tv show`, `show`, `episode`, `episódio`, `season`, `temporada`
- **Exemplos de group-title**:
  - `Series`
  - `Séries`
  - `TV Shows`
  - `Seriados`

### 4. Agrupamento de Séries

Para séries, o sistema:
- **Detecta padrões** de temporada/episódio: `S01E01`, `S1E1`, `Temporada 1 Episódio 1`
- **Agrupa episódios** por série e temporada
- **Organiza** em estrutura hierárquica: Série → Temporadas → Episódios

## Formato M3U Suportado

O sistema suporta o formato M3U padrão com metadados:

```m3u
#EXTM3U
#EXTINF:-1 tvg-id="channel1" tvg-name="Canal 1" tvg-logo="http://example.com/logo.png" group-title="Canais",Canal 1
http://example.com/stream1.m3u8
#EXTINF:-1 tvg-id="movie1" tvg-name="Filme 1" tvg-logo="http://example.com/poster.jpg" group-title="Movies",Filme 1
http://example.com/movie1.mp4
#EXTINF:-1 tvg-id="series1" tvg-name="Série 1 - S01E01" tvg-logo="http://example.com/poster.jpg" group-title="Series",Série 1 - S01E01
http://example.com/series1-s01e01.mp4
```

## URLs Suportadas

O sistema tenta automaticamente construir a URL M3U a partir da base URL fornecida:

### Padrões Comuns:

1. **URL direta M3U**:
   ```
   http://aquisuaurl.top/playlist.m3u
   ```

2. **URL com get.php**:
   ```
   http://aquisuaurl.top/get.php?username=USER&password=PASS&type=m3u_plus
   ```

3. **URL base (construção automática)**:
   ```
   http://aquisuaurl.top
   ```
   O sistema tenta:
   - `http://aquisuaurl.top/get.php?username=...&password=...&type=m3u_plus`
   - `http://aquisuaurl.top/playlist.m3u?username=...&password=...`

## Autenticação

O sistema suporta autenticação HTTP Basic quando necessário:
- Username e password são enviados via headers `Authorization: Basic ...`
- Também podem ser incluídos na URL como parâmetros

## Exemplo de Uso

1. **Configure a playlist IPTV** no dashboard:
   - URL: `http://aquisuaurl.top`
   - Username: `seu_usuario`
   - Password: `sua_senha`

2. **O sistema automaticamente**:
   - Detecta que é uma URL M3U
   - Faz o download da playlist
   - Parseia e categoriza o conteúdo
   - Distribui nas seções corretas

3. **Resultado**:
   - **Live TV**: Canais categorizados como "ao vivo"
   - **Filmes**: Conteúdo categorizado como "movies/filmes"
   - **Séries**: Conteúdo categorizado como "series/séries", agrupado por temporada

## Troubleshooting

### Conteúdo não está sendo categorizado corretamente

1. **Verifique o `group-title`** na playlist M3U
2. **Use palavras-chave** reconhecidas (veja seção de categorização)
3. **Verifique os logs** do backend para ver como o conteúdo está sendo categorizado

### Séries não estão sendo agrupadas

1. **Use padrões** de nomeação: `Série X - S01E01`, `Série X S1E1`
2. **Mantenha nomes consistentes** para a mesma série
3. **Use o mesmo `group-title`** para todos os episódios de uma série

### URL M3U não está sendo detectada

1. **Verifique se a URL** contém `.m3u` ou `get.php`
2. **Tente fornecer a URL completa** da playlist
3. **Verifique os logs** para ver qual padrão está sendo tentado

## Logs

O sistema registra informações úteis nos logs:

```
[CONTENT] M3U live -> http://aquisuaurl.top/get.php?username=...&password=...&type=m3u_plus
[CONTENT] Categorizando: 150 canais, 50 filmes, 30 séries
```

## Melhorias Futuras

- Suporte a múltiplas playlists M3U
- Cache de playlists parseadas
- Personalização de palavras-chave de categorização
- Suporte a EPG (Electronic Program Guide) via M3U

