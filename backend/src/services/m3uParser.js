/**
 * Parser M3U para categorização automática de conteúdo IPTV
 * Suporta metadados: group-title, tvg-id, tvg-logo, tvg-name
 */

const fetch = require('node-fetch');

const DEFAULT_TIMEOUT = Number(process.env.EXTERNAL_API_TIMEOUT || 8000);

/**
 * Palavras-chave para identificar categorias
 */
const CATEGORY_KEYWORDS = {
  live: [
    'live', 'tv', 'canal', 'channel', 'ao vivo', 'televisão',
    'sport', 'esporte', 'news', 'notícia', 'music', 'música',
    'entertainment', 'entretenimento', 'documentary', 'documentário',
    'hd', 'fhd', '4k', 'iptv', 'stream'
  ],
  movies: [
    'movie', 'filme', 'cinema', 'film', 'película', 'pelicula',
    'vod', 'video on demand', 'on demand', 'movies', 'filmes',
    'cinema', 'cine', 'movie', 'film', 'peliculas', 'películas',
    'longa', 'longa-metragem', 'feature', 'feature film'
  ],
  series: [
    'series', 'série', 'serie', 'tv show', 'show', 'shows',
    'episode', 'episódio', 'episodio', 'season', 'temporada',
    'seriado', 'telenovela', 'novela', 'drama', 'comedy',
    'comédia', 'comedia', 'anime', 'cartoon', 'desenho',
    's01e', 's02e', 't01e', 't02e', 'season', 'temporada',
    'ep ', 'ep.', 'episodio', 'episódio'
  ]
};

/**
 * Plataformas de streaming conhecidas
 */
const STREAMING_PLATFORMS = [
  'netflix', 'amazon prime', 'amazon', 'prime video', 'disney+', 'disney plus', 'disney',
  'hbo', 'hbo max', 'hbo go', 'max', 'paramount+', 'paramount plus', 'paramount',
  'apple tv+', 'apple tv', 'apple', 'star+', 'star plus', 'star',
  'globoplay', 'globoplay', 'globosat', 'telecine', 'telecine play',
  'looke', 'looke', 'oi play', 'oi', 'claro video', 'claro',
  'now', 'now online', 'now tv', 'sky', 'sky go', 'sky online',
  'crunchyroll', 'funimation', 'hulu', 'peacock', 'peacock tv',
  'youtube premium', 'youtube', 'youtube tv', 'pluto tv', 'pluto',
  'tubi', 'crackle', 'vudu', 'mubi', 'shudder', 'acorn tv',
  'britbox', 'curiositystream', 'dc universe', 'espn+', 'espn',
  'fubo tv', 'fubo', 'imdb tv', 'imdb', 'kanopy', 'pbs',
  'philo', 'sling tv', 'sling', 'tnt go', 'tnt', 'tbs',
  'tcm', 'tru tv', 'adult swim', 'cartoon network', 'cn',
  'nickelodeon', 'nick', 'mtv', 'vh1', 'comedy central',
  'fox', 'fox sports', 'fox news', 'cnn', 'bbc', 'bbc iplayer',
  'itv', 'channel 4', 'channel 5', 'rtl', 'pro7', 'sat1',
  'tf1', 'france tv', 'rai', 'rai play', 'raiplay', 'rai',
  'rtve', 'rtve play', 'rtveplay', 'tv3', 'tv4', 'svt',
  'nrk', 'dr', 'tv2', 'rtl', 'vtm', 'een', 'canvas',
  'rtbf', 'rtbf auvio', 'rtbfauvio', 'arte', 'arte tv',
  'zdf', 'zdfmediathek', 'ard', 'ardmediathek', 'das erste',
  'mdr', 'ndr', 'wdr', 'swr', 'br', 'hr', 'rbb', 'sr',
  'phoenix', 'tagesschau24', 'one', 'kika', '3sat', 'arte',
  'zdfneo', 'zdfinfo', 'zdfkultur', 'zdfneo', 'zdfinfo',
  'zdfkultur', 'zdfneo', 'zdfinfo', 'zdfkultur'
];

/**
 * Gêneros que devem ser ignorados como categorias
 */
const GENRE_KEYWORDS = [
  'terror', 'horror', 'thriller', 'suspense', 'romance', 'romântico',
  'comédia', 'comedy', 'drama', 'ação', 'action', 'aventura', 'adventure',
  'ficção científica', 'sci-fi', 'science fiction', 'fantasia', 'fantasy',
  'animação', 'animation', 'anime', 'documentário', 'documentary',
  'biografia', 'biography', 'história', 'history', 'guerra', 'war',
  'western', 'faroeste', 'musical', 'crime', 'policial', 'police',
  'mistério', 'mystery', 'noir', 'gangster', 'mob', 'mafia',
  'super-herói', 'superhero', 'super hero', 'zombie', 'zumbi',
  'vampiro', 'vampire', 'monstro', 'monster', 'slasher', 'gore',
  'mockumentary', 'mockumentário', 'road movie', 'buddy movie',
  'coming of age', 'teen', 'adolescente', 'family', 'família',
  'children', 'criança', 'infantil', 'adult', 'adulto', 'erótico',
  'erotic', 'lgbt', 'lgbtq', 'queer', 'indie', 'independent',
  'independente', 'cult', 'culto', 'b movie', 'b-movie'
];

/**
 * Identifica se uma categoria é uma plataforma de streaming
 */
const isStreamingPlatform = (category) => {
  if (!category) return false;
  const normalized = category.toLowerCase().trim();
  return STREAMING_PLATFORMS.some(platform => normalized.includes(platform));
};

/**
 * Identifica se uma categoria é um gênero (deve ser ignorada)
 */
const isGenre = (category) => {
  if (!category) return false;
  const normalized = category.toLowerCase().trim();
  return GENRE_KEYWORDS.some(genre => normalized.includes(genre));
};

/**
 * Extrai a plataforma do group-title, ignorando gêneros
 */
const extractPlatform = (groupTitle) => {
  if (!groupTitle) return null;
  
  const normalized = groupTitle.toLowerCase().trim();
  
  // Primeiro, verifica se é uma plataforma conhecida
  for (const platform of STREAMING_PLATFORMS) {
    if (normalized.includes(platform)) {
      // Retorna o nome da plataforma formatado
      return platform.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
  }
  
  // Se não encontrou plataforma, verifica se não é um gênero
  if (isGenre(groupTitle)) {
    return null; // Ignora gêneros
  }
  
  // Se não é gênero nem plataforma conhecida, retorna o group-title original
  // mas apenas se não contiver palavras-chave de gênero
  return groupTitle;
};

/**
 * Normaliza e categoriza baseado no group-title e nome do item
 */
const categorizeByGroupTitle = (groupTitle, itemName = '') => {
  const normalizedGroup = (groupTitle || '').toLowerCase().trim();
  const normalizedName = (itemName || '').toLowerCase().trim();
  const combined = `${normalizedGroup} ${normalizedName}`;

  // Se não tem group-title, tenta categorizar pelo nome
  if (!normalizedGroup) {
    // Verifica padrões de séries no nome
    const seriesPatterns = [
      /s\d+e\d+/i,           // S01E01, S1E1
      /temporada\s*\d+/i,    // Temporada 1
      /season\s*\d+/i,       // Season 1
      /epis[oó]dio\s*\d+/i,  // Episódio 1
      /ep\.?\s*\d+/i,        // Ep. 1, Ep 1
      /t\d+e\d+/i,           // T01E01
    ];
    for (const pattern of seriesPatterns) {
      if (pattern.test(normalizedName)) {
        return 'series';
      }
    }
    return 'live'; // Sem group-title, assume canal
  }

  // Verifica palavras-chave de filmes (prioridade alta)
  for (const keyword of CATEGORY_KEYWORDS.movies) {
    if (normalizedGroup.includes(keyword) || normalizedName.includes(keyword)) {
      return 'movies';
    }
  }

  // Verifica palavras-chave de séries (prioridade alta)
  for (const keyword of CATEGORY_KEYWORDS.series) {
    if (normalizedGroup.includes(keyword) || normalizedName.includes(keyword)) {
      return 'series';
    }
  }

  // Verifica padrões de séries no nome (S01E01, Temporada, etc.)
  const seriesPatterns = [
    /s\d+e\d+/i,           // S01E01, S1E1
    /temporada\s*\d+/i,    // Temporada 1
    /season\s*\d+/i,       // Season 1
    /epis[oó]dio\s*\d+/i,  // Episódio 1
    /ep\.?\s*\d+/i,        // Ep. 1, Ep 1
    /t\d+e\d+/i,           // T01E01
  ];

  for (const pattern of seriesPatterns) {
    if (pattern.test(combined)) {
      return 'series';
    }
  }

  // Verifica se é claramente canal ao vivo (palavras-chave específicas de TV)
  const liveKeywords = ['live', 'tv', 'canal', 'channel', 'ao vivo', 'televisão', 'sport', 'esporte', 'news', 'notícia', 'music', 'música'];
  let isLive = false;
  for (const keyword of liveKeywords) {
    if (normalizedGroup.includes(keyword)) {
      isLive = true;
      break;
    }
  }

  // Se não é claramente live TV e não tem palavras-chave de filme/série,
  // tenta inferir pelo group-title comum
  if (!isLive) {
    // Se o group-title parece ser um gênero ou categoria de conteúdo, pode ser filme/série
    // Mas por padrão, se não identificou nada específico, assume live
    // (isso pode precisar de ajuste baseado nos group-titles reais)
  }

  // Padrão: canais ao vivo (mais comum em playlists IPTV)
  return 'live';
};

/**
 * Extrai metadados de uma linha EXTINF
 * Formato: #EXTINF:-1 tvg-id="..." tvg-name="..." tvg-logo="..." group-title="...",Nome do Canal
 */
const parseExtinfLine = (line) => {
  const metadata = {
    tvgId: null,
    tvgName: null,
    tvgLogo: null,
    groupTitle: null,
    name: null,
    duration: -1,
  };

  // Extrai duração (primeiro número após #EXTINF:)
  const durationMatch = line.match(/^#EXTINF:(-?\d+)/);
  if (durationMatch) {
    metadata.duration = parseInt(durationMatch[1], 10);
  }

  // Extrai atributos (tvg-id, tvg-name, tvg-logo, group-title)
  const tvgIdMatch = line.match(/tvg-id="([^"]+)"/i);
  if (tvgIdMatch) metadata.tvgId = tvgIdMatch[1];

  const tvgNameMatch = line.match(/tvg-name="([^"]+)"/i);
  if (tvgNameMatch) metadata.tvgName = tvgNameMatch[1];

  const tvgLogoMatch = line.match(/tvg-logo="([^"]+)"/i);
  if (tvgLogoMatch) metadata.tvgLogo = tvgLogoMatch[1];

  const groupTitleMatch = line.match(/group-title="([^"]+)"/i);
  if (groupTitleMatch) metadata.groupTitle = groupTitleMatch[1];

  // Extrai o nome do canal (após a última vírgula)
  const nameMatch = line.match(/,(.+)$/);
  if (nameMatch) {
    metadata.name = nameMatch[1].trim();
  }

  return metadata;
};

/**
 * Faz fetch da URL M3U com autenticação básica se necessário
 */
const fetchM3UContent = async (url, username, password) => {
  const headers = {
    'User-Agent': 'ULTRAIPTV-Backend/1.0',
  };

  // Adiciona autenticação básica se username/password fornecidos
  if (username && password) {
    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    headers['Authorization'] = `Basic ${auth}`;
  }

  // Usa Promise.race para timeout (compatível com node-fetch 2.x)
  const fetchPromise = fetch(url, {
    method: 'GET',
    headers,
  });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Tempo limite ao buscar playlist M3U')), DEFAULT_TIMEOUT)
  );

  const response = await Promise.race([fetchPromise, timeoutPromise]);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const text = await response.text();
  return text;
};

/**
 * Parse do conteúdo M3U e categorização automática
 */
const parseM3U = (m3uContent, baseUrl = '') => {
  const lines = m3uContent.split(/\r?\n/).map(line => line.trim()).filter(line => line);
  
  if (lines.length === 0 || !lines[0].startsWith('#EXTM3U')) {
    throw new Error('Formato M3U inválido: cabeçalho #EXTM3U não encontrado');
  }

  const result = {
    live: [],
    movies: [],
    series: [],
  };

  // Estatísticas para debug
  const stats = {
    total: 0,
    byCategory: { live: 0, movies: 0, series: 0 },
    groupTitles: new Set(),
  };

  let currentEntry = null;
  let entryIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Linha EXTINF - início de uma entrada
    if (line.startsWith('#EXTINF:')) {
      const metadata = parseExtinfLine(line);
      const itemName = metadata.tvgName || metadata.name || '';
      const category = categorizeByGroupTitle(metadata.groupTitle, itemName);

      // Extrai plataforma do group-title (ignora gêneros)
      const platform = extractPlatform(metadata.groupTitle);
      
      currentEntry = {
        id: metadata.tvgId || `entry-${entryIndex}`,
        name: itemName || `Item ${entryIndex + 1}`,
        logo: metadata.tvgLogo || null,
        category: platform || metadata.groupTitle || 'Geral',
        stream_url: null, // será preenchido na próxima linha
        direct_url: null,
        duration: metadata.duration,
        groupTitle: metadata.groupTitle,
        tvgId: metadata.tvgId,
        tvgName: metadata.tvgName,
        _category: category, // categoria detectada
      };

      entryIndex++;
    }
    // Linha de URL - continuação da entrada anterior
    else if (line && !line.startsWith('#') && currentEntry) {
      // Resolve URL relativa para absoluta se necessário
      let streamUrl = line;
      if (baseUrl && !/^https?:\/\//i.test(streamUrl)) {
        const base = baseUrl.replace(/\/+$/, '');
        streamUrl = streamUrl.startsWith('/') 
          ? `${base}${streamUrl}`
          : `${base}/${streamUrl}`;
      }

      currentEntry.stream_url = streamUrl;
      currentEntry.direct_url = streamUrl;

      // Estatísticas
      stats.total++;
      stats.byCategory[currentEntry._category]++;
      if (currentEntry.groupTitle) {
        stats.groupTitles.add(currentEntry.groupTitle);
      }

      // Adiciona à categoria apropriada
      if (currentEntry._category === 'movies') {
        result.movies.push({
          id: currentEntry.id,
          title: currentEntry.name,
          poster: currentEntry.logo,
          stream_url: currentEntry.stream_url,
          direct_url: currentEntry.direct_url,
          category: currentEntry.category,
          year: null, // M3U geralmente não tem ano
          description: null,
        });
      } else if (currentEntry._category === 'series') {
        // Extrai nome da série e informações de temporada/episódio
        // Padrões comuns: "Série X - S01E01", "Série X S1E1", "Série X - Temporada 1 Episódio 1"
        const name = currentEntry.name;
        const seasonMatch = name.match(/[Ss](\d+)[Ee](\d+)/) || name.match(/[Tt]emporada\s*(\d+).*[Ee]pis[oó]dio\s*(\d+)/i);
        
        let seriesTitle = name;
        let seasonNum = 1;
        let episodeNum = 1;
        
        if (seasonMatch) {
          // Extrai temporada e episódio
          seasonNum = parseInt(seasonMatch[1], 10);
          episodeNum = parseInt(seasonMatch[2], 10);
          // Remove padrão de temporada/episódio do título
          seriesTitle = name.replace(/[Ss]\d+[Ee]\d+.*$/, '').replace(/[Tt]emporada\s*\d+.*[Ee]pis[oó]dio\s*\d+.*$/i, '').trim();
          // Remove separadores comuns
          seriesTitle = seriesTitle.replace(/[-–—]\s*$/, '').trim();
        } else {
          // Tenta agrupar por similaridade de nome (primeiras palavras)
          const words = name.split(/\s+/);
          if (words.length > 2) {
            seriesTitle = words.slice(0, Math.min(3, words.length - 1)).join(' ');
          }
        }

        // Busca série existente (por título similar)
        const existingSeries = result.series.find(s => {
          const sTitle = s.title.toLowerCase();
          const entryTitle = seriesTitle.toLowerCase();
          // Match exato ou se um contém o outro
          return sTitle === entryTitle || 
                 sTitle.includes(entryTitle) || 
                 entryTitle.includes(sTitle) ||
                 (sTitle.split(' ')[0] === entryTitle.split(' ')[0] && entryTitle.length > 5);
        });

        if (existingSeries) {
          // Encontra ou cria temporada
          let season = existingSeries.seasons?.find(se => se.number === seasonNum);
          if (!season) {
            if (!existingSeries.seasons) {
              existingSeries.seasons = [];
            }
            season = {
              id: `${existingSeries.id}-season-${seasonNum}`,
              number: seasonNum,
              episodes: [],
            };
            existingSeries.seasons.push(season);
            // Ordena temporadas
            existingSeries.seasons.sort((a, b) => a.number - b.number);
          }

          // Adiciona episódio
          season.episodes.push({
            id: currentEntry.id,
            title: currentEntry.name,
            stream_url: currentEntry.stream_url,
            direct_url: currentEntry.direct_url,
            number: episodeNum,
          });
          
          // Ordena episódios
          season.episodes.sort((a, b) => a.number - b.number);
        } else {
          // Nova série
          const newSeries = {
            id: currentEntry.id,
            title: seriesTitle || currentEntry.name,
            poster: currentEntry.logo,
            description: null,
            category: currentEntry.category,
            seasons: [{
              id: `${currentEntry.id}-season-${seasonNum}`,
              number: seasonNum,
              episodes: [{
                id: currentEntry.id,
                title: currentEntry.name,
                stream_url: currentEntry.stream_url,
                direct_url: currentEntry.direct_url,
                number: episodeNum,
              }],
            }],
          };
          result.series.push(newSeries);
        }
      } else {
        // Canais ao vivo
        result.live.push({
          id: currentEntry.id,
          name: currentEntry.name,
          logo: currentEntry.logo,
          stream_url: currentEntry.stream_url,
          direct_url: currentEntry.direct_url,
          category: currentEntry.category,
        });
      }

      currentEntry = null;
    }
  }

  // Log de estatísticas detalhadas
  console.log(`[M3U Parser] 📊 Estatísticas de categorização:`);
  console.log(`  Total de itens: ${stats.total}`);
  console.log(`  📺 Canais ao vivo: ${stats.byCategory.live} (${((stats.byCategory.live / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  🎬 Filmes: ${stats.byCategory.movies} (${((stats.byCategory.movies / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  📺 Séries: ${stats.byCategory.series} (${((stats.byCategory.series / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  Group-titles únicos: ${stats.groupTitles.size}`);
  
  // Agrupa group-titles por categoria para análise
  const groupTitleAnalysis = new Map();
  Array.from(stats.groupTitles).forEach(title => {
    const lower = title.toLowerCase();
    let category = 'unknown';
    if (CATEGORY_KEYWORDS.movies.some(k => lower.includes(k))) category = 'movies';
    else if (CATEGORY_KEYWORDS.series.some(k => lower.includes(k))) category = 'series';
    else if (CATEGORY_KEYWORDS.live.some(k => lower.includes(k))) category = 'live';
    
    if (!groupTitleAnalysis.has(category)) {
      groupTitleAnalysis.set(category, []);
    }
    groupTitleAnalysis.get(category).push(title);
  });
  
  console.log(`  📋 Group-titles por categoria:`);
  ['movies', 'series', 'live', 'unknown'].forEach(cat => {
    const titles = groupTitleAnalysis.get(cat) || [];
    if (titles.length > 0) {
      console.log(`    ${cat}: ${titles.length} - ${titles.slice(0, 10).join(', ')}${titles.length > 10 ? '...' : ''}`);
    }
  });
  
  if (stats.groupTitles.size <= 50) {
    const titles = Array.from(stats.groupTitles).sort();
    console.log(`  📝 Todos os group-titles:`, titles);
  } else {
    const titles = Array.from(stats.groupTitles).sort().slice(0, 50);
    console.log(`  📝 Primeiros 50 group-titles:`, titles);
  }

  return result;
};

/**
 * Detecta se a URL é uma playlist M3U
 */
const isM3UUrl = (url) => {
  if (!url) return false;
  const normalized = url.toLowerCase();
  return normalized.includes('.m3u') || 
         normalized.includes('get.php') ||
         normalized.includes('playlist.m3u') ||
         normalized.includes('get.php?');
};

/**
 * Detecta se a URL é uma API Xtream
 */
const isXtreamApi = (url) => {
  if (!url) return false;
  const normalized = url.toLowerCase();
  return normalized.includes('player_api.php') ||
         normalized.includes('/player_api') ||
         (normalized.includes('xtream') && !normalized.includes('.m3u'));
};

/**
 * Busca e parseia playlist M3U
 */
const fetchAndParseM3U = async (url, username, password) => {
  const m3uContent = await fetchM3UContent(url, username, password);
  
  // Extrai base URL para resolver URLs relativas
  const urlObj = new URL(url);
  const baseUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/'))}`;
  
  const parsed = parseM3U(m3uContent, baseUrl);
  
  return parsed;
};

module.exports = {
  parseM3U,
  fetchAndParseM3U,
  isM3UUrl,
  isXtreamApi,
  categorizeByGroupTitle,
};

