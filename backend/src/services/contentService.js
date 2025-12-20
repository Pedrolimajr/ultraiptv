const fetch = require('node-fetch');
const sampleContent = require('../data/sampleContent');
const { fetchAndParseM3U, isM3UUrl, isXtreamApi } = require('./m3uParser');

const DEFAULT_TIMEOUT = Number(process.env.EXTERNAL_API_TIMEOUT || 8000);
const EXTERNAL_API_URL = process.env.EXTERNAL_API_URL || 'http://aguacomgas.shop';
const EXTERNAL_API_TOKEN = process.env.EXTERNAL_API_TOKEN;
const ENABLE_SAMPLE_FALLBACK = String(
  process.env.ENABLE_SAMPLE_CONTENT_FALLBACK ?? 'true'
).toLowerCase() === 'true';
const XTREAM_ACTIONS = {
  live: 'get_live_streams',
  movies: 'get_vod_streams',
  series: 'get_series',
};
const XTREAM_SERIES_INFO_ACTION = 'get_series_info';
const XTREAM_CATEGORY_ACTIONS = {
  live: 'get_live_categories',
  movies: 'get_vod_categories',
  series: 'get_series_categories',
};

const normalizeArray = (payload, key) => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload[key])) return payload[key];
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
};

const fetchWithTimeout = (url, options = {}) => (
  Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Tempo limite ao acessar API externa')), DEFAULT_TIMEOUT)
    ),
  ])
);

const buildHeaders = (username) => {
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'ULTRAIPTV-Backend/1.0',
  };

  if (EXTERNAL_API_TOKEN) {
    headers.Authorization = `Bearer ${EXTERNAL_API_TOKEN}`;
  } else if (username) {
    headers.Authorization = `Bearer ${username}`;
  }

  return headers;
};

const RESOURCE_CONFIG = {
  live: {
    key: 'channels',
    sample: sampleContent.live,
    envPath: 'EXTERNAL_API_LIVE_PATH',
  },
  movies: {
    key: 'movies',
    sample: sampleContent.movies,
    envPath: 'EXTERNAL_API_MOVIES_PATH',
  },
  series: {
    key: 'series',
    sample: sampleContent.series,
    envPath: 'EXTERNAL_API_SERIES_PATH',
  },
  epg: {
    key: 'epg',
    sample: sampleContent.epg,
    envPath: 'EXTERNAL_API_EPG_PATH',
  },
};

const ensureHttp = (url) => {
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `http://${url}`;
};

const sanitizeBaseUrl = (url) => {
  const cleaned = String(url || '')
    .trim()
    .replace(/^['"`]+|['"`]+$/g, '')
    .replace(/\/+$/, '');
  return ensureHttp(cleaned);
};

const getXtreamRoot = (config) => sanitizeBaseUrl(config.baseUrl).replace(/\/player_api\.php$/i, '');

const buildXtreamApiEndpoint = (config) => `${getXtreamRoot(config)}/player_api.php`;

const buildXtreamApiUrl = (config, params = {}) => {
  const endpoint = buildXtreamApiEndpoint(config);
  const url = new URL(endpoint);
  url.searchParams.set('username', config.username);
  url.searchParams.set('password', config.password);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
};

const buildXtreamStreamUrl = (config, type, streamId, extension) => {
  if (!streamId) return '';
  const root = getXtreamRoot(config);
  const map = {
    live: 'live',
    movies: 'movie',
    movie: 'movie',
    series: 'series',
  };
  const folder = map[type] || 'live';
  const ext = extension || (folder === 'live' ? 'm3u8' : 'mp4');
  return `${root}/${folder}/${config.username}/${config.password}/${streamId}.${ext}`;
};

const mapXtreamLive = (payload = [], config, catMap = {}) => {
  const list = Array.isArray(payload) ? payload : payload?.channels || payload?.results || [];
  return list.map((item, index) => {
    const streamId = item.stream_id || item.streamId || item.num || `${item.name || 'channel'}-${index}`;
    return {
      id: String(streamId),
      name: item.name || `Canal ${streamId}`,
      logo: item.stream_icon || item.icon || null,
      category: (catMap && item.category_id ? (catMap[String(item.category_id)] || null) : null) || item.category_name || item.category_id?.toString() || 'Canais',
      stream_url: buildXtreamStreamUrl(config, 'live', streamId, item.container_extension || 'm3u8'),
      direct_url: buildXtreamStreamUrl(config, 'live', streamId, 'ts'),
    };
  });
};

// Função auxiliar para extrair plataforma (similar ao m3uParser)
const extractPlatformFromCategory = (categoryName) => {
  if (!categoryName) return null;
  const normalized = String(categoryName).toLowerCase().trim();
  
  const STREAMING_PLATFORMS = [
    'netflix', 'amazon prime', 'amazon', 'prime video', 'disney+', 'disney plus', 'disney',
    'hbo', 'hbo max', 'hbo go', 'max', 'paramount+', 'paramount plus', 'paramount',
    'apple tv+', 'apple tv', 'apple', 'star+', 'star plus', 'star',
    'globoplay', 'globosat', 'telecine', 'telecine play',
    'looke', 'oi play', 'oi', 'claro video', 'claro',
    'now', 'now online', 'now tv', 'sky', 'sky go', 'sky online',
    'crunchyroll', 'funimation', 'hulu', 'peacock', 'peacock tv',
    'youtube premium', 'youtube', 'youtube tv', 'pluto tv', 'pluto',
    'tubi', 'crackle', 'vudu', 'mubi', 'shudder', 'acorn tv',
  ];
  
  const GENRE_KEYWORDS = [
    'terror', 'horror', 'thriller', 'suspense', 'romance', 'romântico',
    'comédia', 'comedy', 'drama', 'ação', 'action', 'aventura', 'adventure',
    'ficção científica', 'sci-fi', 'science fiction', 'fantasia', 'fantasy',
    'animação', 'animation', 'anime', 'documentário', 'documentary',
    'policial', 'police', 'crime', 'mistério', 'mystery',
  ];
  
  // Verifica se é gênero (ignora)
  if (GENRE_KEYWORDS.some(genre => normalized.includes(genre))) {
    return null;
  }
  
  // Verifica se é plataforma
  for (const platform of STREAMING_PLATFORMS) {
    if (normalized.includes(platform)) {
      return platform.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
  }
  
  // Se não é gênero nem plataforma conhecida, retorna o nome original
  return categoryName;
};

const mapXtreamMovies = (payload = [], config, catMap = {}) => {
  const list = Array.isArray(payload) ? payload : payload?.movies || payload?.results || [];
  return list.map((item, index) => {
    const streamId = item.stream_id || item.streamId || `${item.name || 'movie'}-${index}`;
    const rawCategory = (catMap && item.category_id ? (catMap[String(item.category_id)] || null) : null) || item.category_name || item.category_id?.toString();
    const category = extractPlatformFromCategory(rawCategory);
    
    return {
      id: String(streamId),
      title: item.name || item.title || `Filme ${streamId}`,
      poster: item.stream_icon || item.cover || null,
      description: item.plot || item.description || '',
      year: item.year ? Number(item.year) : undefined,
      category: category || 'Geral',
      stream_url: buildXtreamStreamUrl(config, 'movies', streamId, item.container_extension || 'mp4'),
      direct_url: buildXtreamStreamUrl(config, 'movies', streamId, item.container_extension || 'mp4'),
    };
  });
};

const mapXtreamSeriesList = (payload = [], config, catMap = {}) => {
  const list = Array.isArray(payload) ? payload : payload?.series || payload?.results || [];
  return list.map((item, index) => {
    const rawCategory = (catMap && item.category_id ? (catMap[String(item.category_id)] || null) : null) || item.category_name || item.category_id?.toString();
    const category = extractPlatformFromCategory(rawCategory);
    
    return {
      id: String(item.series_id || item.id || `${item.name || 'series'}-${index}`),
      title: item.name || item.title || `Série ${index + 1}`,
      poster: item.cover || item.backdrop_path?.[0] || null,
      description: item.plot || item.description || '',
      seasons: item.seasons || [],
      category: category || 'Geral',
      stream_url: '', // preenchido no detalhe
    };
  });
};

const mapXtreamSeriesDetail = (payload = {}, config, fallbackId) => {
  const info = payload.info || {};
  const episodesMap = payload.episodes || {};
  const seasons = Object.entries(episodesMap).map(([seasonNumber, episodes]) => ({
    id: `${info.series_id || fallbackId || 'series'}-season-${seasonNumber}`,
    number: Number(seasonNumber),
    episodes: (episodes || []).map((episode, idx) => {
      const episodeId = episode.id || episode.stream_id || `${seasonNumber}-${idx}`;
      const container = episode.container_extension || 'mp4';
      return {
        id: String(episodeId),
        number: episode.episode_num || Number(idx + 1),
        title: episode.title || episode.name || `Episódio ${episode.episode_num || idx + 1}`,
        stream_url: buildXtreamStreamUrl(config, 'series', episodeId, container),
        direct_url: buildXtreamStreamUrl(config, 'series', episodeId, container),
      };
    }),
  }));

  return {
    id: String(info.series_id || fallbackId || 'series'),
    title: info.name || info.title || 'Série',
    poster: info.cover || info.backdrop_path?.[0] || null,
    description: info.plot || info.description || '',
    seasons,
  };
};

const buildResourceUrl = (resource, resourceConfig) => {
  const base = EXTERNAL_API_URL.replace(/\/$/, '');
  const overridePath = resourceConfig.envPath ? process.env[resourceConfig.envPath] : null;
  const rawPath = overridePath || resource;
  if (!rawPath) return base;
  const sanitizedPath = rawPath.replace(/^\/+/, '');
  return `${base}/${sanitizedPath}`;
};

const fetchDefaultResource = async (resource, username) => {
  const resourceConfig = RESOURCE_CONFIG[resource];
  if (!resourceConfig) throw new Error(`Resource "${resource}" não suportado`);

  const url = buildResourceUrl(resource, resourceConfig);

  console.log(`[CONTENT] Buscando ${resource} em ${url}`);
  const response = await fetchWithTimeout(url, {
    method: 'GET',
    headers: buildHeaders(username),
  });

  console.log(`[CONTENT] ${resource} status: ${response.status}`);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${response.statusText} - ${text.substring(0, 120)}`);
  }

  const data = await response.json();
  const list = normalizeArray(data, resourceConfig.key);
  if (!list.length) {
    throw new Error('Resposta vazia ou sem itens');
  }

  return {
    source: 'external',
    [resourceConfig.key]: list,
  };
};

const fetchXtreamResource = async (resource, context) => {
  const action = XTREAM_ACTIONS[resource];
  if (!action) {
    throw new Error(`Recurso "${resource}" não suportado via Xtream`);
  }

  const url = buildXtreamApiUrl(context.iptvConfig, { action });
  console.log(`[CONTENT] Xtream ${resource} -> ${url}`);

  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${response.statusText} - ${text.substring(0, 120)}`);
  }

  const payload = await response.json();
  const map = {
    live: mapXtreamLive,
    movies: mapXtreamMovies,
    series: mapXtreamSeriesList,
  }[resource];

  if (!map) {
    throw new Error(`Mapper não encontrado para ${resource}`);
  }

  let catMap = {};
  try {
    const catAction = XTREAM_CATEGORY_ACTIONS[resource];
    if (catAction) {
      const catUrl = buildXtreamApiUrl(context.iptvConfig, { action: catAction });
      const catResp = await fetchWithTimeout(catUrl);
      if (catResp.ok) {
        const cats = await catResp.json();
        const arr = Array.isArray(cats) ? cats : (cats?.categories || cats?.results || []);
        catMap = (arr || []).reduce((acc, c) => {
          const id = c.category_id || c.id || c.categoryId;
          const name = c.category_name || c.name || String(id || '').toString();
          if (id) acc[String(id)] = String(name);
          return acc;
        }, {});
      }
    }
  } catch {}

  const normalizedList = map(payload, context.iptvConfig, catMap);

  if (!normalizedList.length) {
    throw new Error('Resposta da API IPTV vazia');
  }

  return {
    source: 'iptv',
    [RESOURCE_CONFIG[resource].key]: normalizedList,
  };
};

const withFallback = (resource, error) => {
  console.warn(`[CONTENT] Falha ao buscar ${resource}: ${error.message}. Usando fallback local.`);
  if (ENABLE_SAMPLE_FALLBACK) {
    const config = RESOURCE_CONFIG[resource];
    return {
      source: 'fallback',
      [config.key]: config.sample,
      fallback: true,
      message: 'Conteúdo exibido a partir do catálogo de demonstração',
    };
  }
  throw error;
};

/**
 * Tenta múltiplos padrões de URL M3U
 */
const tryMultipleM3UPatterns = async (baseUrl, username, password) => {
  const patterns = [
    // Padrão 1: get.php?username=...&password=...&type=m3u_plus
    () => {
      const separator = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${separator}username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&type=m3u_plus&output=m3u8`;
    },
    // Padrão 2: /get.php?username=...&password=...
    () => {
      const base = baseUrl.replace(/\/+$/, '');
      return `${base}/get.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&type=m3u_plus`;
    },
    // Padrão 3: get.php?username=...&password=...&type=m3u
    () => {
      const separator = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${separator}username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&type=m3u`;
    },
    // Padrão 4: /playlist.m3u?username=...&password=...
    () => {
      const base = baseUrl.replace(/\/+$/, '');
      return `${base}/playlist.m3u?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
    },
    // Padrão 5: URL direta
    () => baseUrl,
  ];

  let lastError = null;
  for (let i = 0; i < patterns.length; i++) {
    try {
      const url = patterns[i]();
      console.log(`[CONTENT] Tentando padrão M3U ${i + 1}: ${url}`);
      const parsed = await fetchAndParseM3U(url, username, password);
      console.log(`[CONTENT] ✅ Sucesso com padrão ${i + 1}! Encontrados: ${parsed.live.length} canais, ${parsed.movies.length} filmes, ${parsed.series.length} séries`);
      return parsed;
    } catch (error) {
      console.warn(`[CONTENT] ❌ Padrão ${i + 1} falhou: ${error.message}`);
      lastError = error;
      // Continua tentando o próximo padrão
    }
  }

  // Se todos os padrões falharam, lança o último erro
  throw new Error(`Todos os padrões M3U falharam. Último erro: ${lastError?.message || 'Desconhecido'}`);
};

/**
 * Busca conteúdo de playlist M3U
 */
const fetchM3UResource = async (resource, context) => {
  const { iptvConfig } = context;
  if (!iptvConfig) {
    throw new Error('Configuração IPTV não fornecida');
  }

  const baseUrl = sanitizeBaseUrl(iptvConfig.baseUrl);
  console.log(`[CONTENT] Tentando buscar ${resource} via M3U da URL: ${baseUrl}`);

  try {
    // Tenta múltiplos padrões de URL
    const parsed = await tryMultipleM3UPatterns(
      baseUrl,
      iptvConfig.username,
      iptvConfig.password
    );
    
    // Retorna o recurso solicitado
    const resourceMap = {
      live: { key: 'channels', data: parsed.live },
      movies: { key: 'movies', data: parsed.movies },
      series: { key: 'series', data: parsed.series },
    };

    const resourceData = resourceMap[resource];
    if (!resourceData) {
      throw new Error(`Recurso "${resource}" não suportado via M3U`);
    }

    if (!resourceData.data || resourceData.data.length === 0) {
      console.warn(`[CONTENT] ⚠️ Nenhum ${resource} encontrado na playlist M3U. Total parseado: ${parsed.live.length} canais, ${parsed.movies.length} filmes, ${parsed.series.length} séries`);
      throw new Error(`Nenhum ${resource} encontrado na playlist M3U. Verifique se o group-title está correto.`);
    }

    console.log(`[CONTENT] ✅ Retornando ${resourceData.data.length} itens de ${resource}`);
    return {
      source: 'm3u',
      [resourceData.key]: resourceData.data,
    };
  } catch (error) {
    console.error(`[CONTENT] ❌ Erro ao processar M3U para ${resource}: ${error.message}`);
    throw error;
  }
};

const fetchContent = async (resource, context = {}) => {
  try {
    // Se tem configuração IPTV, detecta o tipo
    if (context.iptvConfig) {
      const baseUrl = sanitizeBaseUrl(context.iptvConfig.baseUrl);
      
      // Detecta se é explicitamente M3U
      if (isM3UUrl(baseUrl)) {
        try {
          return await fetchM3UResource(resource, context);
        } catch (m3uError) {
          console.warn(`[CONTENT] M3U falhou: ${m3uError.message}`);
          // Se falhar, tenta como Xtream como fallback
          if (isXtreamApi(baseUrl) || baseUrl.includes('player_api')) {
            console.log(`[CONTENT] Tentando como Xtream após falha M3U`);
            return await fetchXtreamResource(resource, context);
          }
          throw m3uError;
        }
      }
      
      // Detecta se é API Xtream
      if (isXtreamApi(baseUrl)) {
        try {
          return await fetchXtreamResource(resource, context);
        } catch (xtreamError) {
          // Se falhar, tenta como M3U como fallback
          console.warn(`[CONTENT] Xtream falhou, tentando como M3U: ${xtreamError.message}`);
          return await fetchM3UResource(resource, context);
        }
      }
      
      // Se não detectou tipo específico, decide a ordem por heurística
      const looksLikeBareHost = /^https?:\/\/[^\/]+$/i.test(baseUrl);
      const preferXtreamFirst = looksLikeBareHost && !isM3UUrl(baseUrl);

      if (preferXtreamFirst) {
        console.log(`[CONTENT] Tipo não detectado, tentando Xtream primeiro: ${baseUrl}`);
        try {
          return await fetchXtreamResource(resource, context);
        } catch (xtreamError) {
          console.warn(`[CONTENT] Xtream falhou, tentando M3U: ${xtreamError.message}`);
          return await fetchM3UResource(resource, context);
        }
      } else {
        console.log(`[CONTENT] Tipo não detectado, tentando M3U primeiro: ${baseUrl}`);
        try {
          return await fetchM3UResource(resource, context);
        } catch (m3uError) {
          console.warn(`[CONTENT] M3U falhou, tentando Xtream: ${m3uError.message}`);
          try {
            return await fetchXtreamResource(resource, context);
          } catch (xtreamError) {
            // Se ambos falharem, lança o erro do M3U (mais comum)
            throw m3uError;
          }
        }
      }
    }
    
    // Fallback para API externa padrão
    return await fetchDefaultResource(resource, context.username);
  } catch (error) {
    console.warn(`[CONTENT] Erro ao buscar ${resource}: ${error.message}`);
    
    // Tenta fallback se tiver configuração IPTV
    if (context.iptvConfig) {
      return withFallback(resource, error);
    }
    
    return withFallback(resource, error);
  }
};

const fetchXtreamSeriesDetails = async ({ iptvConfig, seriesId }) => {
  if (!iptvConfig) {
    throw new Error('Configuração IPTV não enviada');
  }
  if (!seriesId) {
    throw new Error('seriesId é obrigatório');
  }

  const url = buildXtreamApiUrl(iptvConfig, {
    action: XTREAM_SERIES_INFO_ACTION,
    series_id: seriesId,
  });

  console.log(`[CONTENT] Xtream series detail -> ${url}`);
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${response.statusText} - ${text.substring(0, 120)}`);
  }
  const payload = await response.json();
  return mapXtreamSeriesDetail(payload, iptvConfig, seriesId);
};

async function getLiveContent(context) {
  return fetchContent('live', context);
}

async function getMoviesContent(context) {
  return fetchContent('movies', context);
}

async function getSeriesContent(context) {
  return fetchContent('series', context);
}

async function getEpgContent(context) {
  return fetchContent('epg', context);
}

/**
 * Busca detalhes de uma série específica
 * Suporta tanto Xtream quanto M3U
 */
async function getSeriesDetails(context) {
  const { iptvConfig } = context;
  if (!iptvConfig) {
    throw new Error('Configuração IPTV não fornecida');
  }

  const baseUrl = sanitizeBaseUrl(iptvConfig.baseUrl);
  
  // Se for M3U, busca a série da lista parseada
  if (isM3UUrl(baseUrl)) {
    try {
      const parsed = await tryMultipleM3UPatterns(
        baseUrl,
        iptvConfig.username,
        iptvConfig.password
      );
      
      const series = parsed.series.find(s => s.id === context.seriesId);
      if (!series) {
        throw new Error(`Série com ID ${context.seriesId} não encontrada`);
      }
      
      // Retorna a série com suas temporadas e episódios
      return series;
    } catch (error) {
      console.error(`[CONTENT] Erro ao buscar detalhes da série M3U: ${error.message}`);
      throw error;
    }
  }
  
  // Para Xtream, usa a função existente
  return fetchXtreamSeriesDetails(context);
}

module.exports = {
  getLiveContent,
  getMoviesContent,
  getSeriesContent,
  getEpgContent,
  getSeriesDetails,
};
