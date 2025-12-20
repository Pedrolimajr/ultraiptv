const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getLiveContent,
  getMoviesContent,
  getSeriesContent,
  getEpgContent,
  getSeriesDetails,
} = require('../services/contentService');
const fetch = require('node-fetch');

const resolveIptvConfig = (req) => {
  const baseUrl = req.headers['x-iptv-base-url'];
  const username = req.headers['x-iptv-username'];
  const password = req.headers['x-iptv-password'];
  if (!baseUrl || !username || !password) {
    return null;
  }
  return {
    baseUrl: String(baseUrl),
    username: String(username),
    password: String(password),
    profile: req.headers['x-iptv-profile'] ? String(req.headers['x-iptv-profile']) : undefined,
    portal: req.headers['x-iptv-portal'] ? String(req.headers['x-iptv-portal']) : 'xtream',
  };
};

const ensureIptvConfig = (req, res) => {
  const config = resolveIptvConfig(req);
  if (!config) {
    res.status(400).json({
      message: 'Configuração IPTV não enviada. Informe baseUrl, username e password nos headers.',
    });
    return null;
  }
  return config;
};

// Proxy para API externa - Canais (com fallback)
router.get('/live', authenticateToken, async (req, res) => {
  try {
    const iptvConfig = ensureIptvConfig(req, res);
    if (!iptvConfig) return;
    
    console.log('[CONTENT] Buscando canais ao vivo...');
    console.log('[CONTENT] Config IPTV:', {
      baseUrl: iptvConfig.baseUrl,
      username: iptvConfig.username,
    });
    
    const payload = await getLiveContent({
      username: req.user?.username,
      iptvConfig,
    });
    
    console.log('[CONTENT] ✅ Canais retornados:', {
      source: payload.source,
      count: payload.channels?.length || 0,
    });
    
    const list = Array.isArray(payload.channels) ? payload.channels : [];
    const categories = Array.from(new Set(list.map((ch) => ch.category).filter(Boolean)));
    res.json({ ...payload, categories });
  } catch (error) {
    console.error('[CONTENT] ❌ Erro ao entregar canais:', error);
    res.status(502).json({
      message: 'Erro ao buscar canais na API externa',
      error: error.message,
      details: error.stack,
    });
  }
});

// Proxy para API externa - Filmes (com fallback)
router.get('/movies', authenticateToken, async (req, res) => {
  try {
    const iptvConfig = ensureIptvConfig(req, res);
    if (!iptvConfig) return;
    
    console.log('[CONTENT] Buscando filmes...');
    console.log('[CONTENT] Config IPTV:', {
      baseUrl: iptvConfig.baseUrl,
      username: iptvConfig.username,
    });
    
    const payload = await getMoviesContent({
      username: req.user?.username,
      iptvConfig,
    });
    // Paginação e filtro por categoria
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(1000, parseInt(req.query.limit, 10) || 200));
    const category = req.query.category ? String(req.query.category) : null;

    const fullList = Array.isArray(payload.movies) ? payload.movies : [];
    const filtered = category ? fullList.filter((m) => m.category === category) : fullList;
    const total = filtered.length;
    const start = (page - 1) * limit;
    const slice = filtered.slice(start, start + limit);
    const hasMore = start + slice.length < total;

    console.log('[CONTENT] ✅ Filmes retornados (paginados):', {
      source: payload.source,
      total,
      page,
      limit,
      count: slice.length,
    });

    const categories = Array.from(new Set(fullList.map((m) => m.category).filter(Boolean)));
    res.json({
      source: payload.source,
      movies: slice,
      page,
      limit,
      total,
      hasMore,
      categories,
    });
  } catch (error) {
    console.error('[CONTENT] ❌ Erro ao entregar filmes:', error);
    res.status(502).json({
      message: 'Erro ao buscar filmes na API externa',
      error: error.message,
      details: error.stack,
    });
  }
});

// Proxy para API externa - Séries (com fallback)
router.get('/series', authenticateToken, async (req, res) => {
  try {
    const iptvConfig = ensureIptvConfig(req, res);
    if (!iptvConfig) return;
    const payload = await getSeriesContent({
      username: req.user?.username,
      iptvConfig,
    });
    // Paginação e filtro por categoria
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(1000, parseInt(req.query.limit, 10) || 200));
    const category = req.query.category ? String(req.query.category) : null;

    const fullList = Array.isArray(payload.series) ? payload.series : [];
    const filtered = category ? fullList.filter((s) => s.category === category) : fullList;
    const total = filtered.length;
    const start = (page - 1) * limit;
    const slice = filtered.slice(start, start + limit);
    const hasMore = start + slice.length < total;

    const categories = Array.from(new Set(fullList.map((s) => s.category).filter(Boolean)));
    res.json({
      source: payload.source,
      series: slice,
      page,
      limit,
      total,
      hasMore,
      categories,
    });
  } catch (error) {
    console.error('[CONTENT] Erro ao entregar séries:', error);
    res.status(502).json({
      message: 'Erro ao buscar séries na API externa',
      error: error.message,
    });
  }
});

// Proxy para API externa - EPG
router.get('/epg', authenticateToken, async (req, res) => {
  try {
    const iptvConfig = ensureIptvConfig(req, res);
    if (!iptvConfig) return;
    const payload = await getEpgContent({
      username: req.user?.username,
      iptvConfig,
    });
    res.json(payload);
  } catch (error) {
    console.error('[CONTENT] Erro ao entregar EPG:', error);
    res.status(502).json({
      message: 'Erro ao buscar EPG na API externa',
      error: error.message,
    });
  }
});

router.get('/series/:seriesId', authenticateToken, async (req, res) => {
  try {
    const iptvConfig = ensureIptvConfig(req, res);
    if (!iptvConfig) return;

    const payload = await getSeriesDetails({
      username: req.user?.username,
      iptvConfig,
      seriesId: req.params.seriesId,
    });

    res.json(payload);
  } catch (error) {
    console.error('[CONTENT] Erro ao entregar detalhe da série:', error);
    res.status(502).json({
      message: 'Erro ao buscar detalhes da série na API externa',
      error: error.message,
    });
  }
});

module.exports = router;
// Proxy de streaming com cabeçalhos CORS
router.get('/proxy', async (req, res) => {
  try {
    const targetUrl = req.query.url;
    if (!targetUrl || typeof targetUrl !== 'string') {
      return res.status(400).json({ message: 'Parâmetro "url" é obrigatório' });
    }

    const response = await fetch(targetUrl);
    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).send(text);
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const isM3U8 = /application\/vnd\.apple\.mpegurl|application\/x-mpegURL|audio\/mpegurl|mpegurl/i.test(contentType) || /\.m3u8(\?|$)/i.test(targetUrl);

    // Sempre habilita CORS
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    });

    if (isM3U8) {
      const text = await response.text();
      const originUrl = new URL(targetUrl);
      const baseDir = `${originUrl.protocol}//${originUrl.host}${originUrl.pathname.substring(0, originUrl.pathname.lastIndexOf('/') + 1)}`;
      const makeAbsolute = (line) => {
        try {
          if (/^https?:\/\//i.test(line)) return line; // já absoluto
          return new URL(line, baseDir).toString();
        } catch {
          return line;
        }
      };
      const proxyWrap = (absUrl) => `http://${req.get('host')}/api/content/proxy?url=${encodeURIComponent(absUrl)}`;

      const rewritten = text.split('\n').map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return line;
        if (trimmed.startsWith('#EXT-X-KEY')) {
          // Reescreve URI="..."
          return trimmed.replace(/URI=\"([^\"]+)\"/i, (m, p1) => {
            const abs = makeAbsolute(p1);
            return `URI="${proxyWrap(abs)}"`;
          });
        }
        if (trimmed.startsWith('#')) {
          return line;
        }
        const abs = makeAbsolute(trimmed);
        return proxyWrap(abs);
      }).join('\n');

      res.set('Content-Type', 'application/vnd.apple.mpegurl');
      return res.send(rewritten);
    }

    // Conteúdo binário (TS, MP4, etc.)
    res.set('Content-Type', contentType);
    response.body.pipe(res);
  } catch (error) {
    console.error('[CONTENT] Erro no proxy de streaming:', error);
    res.status(502).json({ message: 'Erro ao fazer proxy do stream', error: error.message });
  }
});
