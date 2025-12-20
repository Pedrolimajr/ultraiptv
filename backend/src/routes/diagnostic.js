const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { fetchAndParseM3U, isM3UUrl, isXtreamApi } = require('../services/m3uParser');
const fetch = require('node-fetch');

/**
 * Função auxiliar para fazer parse rápido (apenas primeiras linhas)
 */
const quickParseM3U = async (url, username, password, maxLines = 1000) => {
  const fetch = require('node-fetch');
  const headers = {
    'User-Agent': 'ULTRAIPTV-Backend/1.0',
  };

  if (username && password) {
    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    headers['Authorization'] = `Basic ${auth}`;
  }

  const fetchPromise = fetch(url, { method: 'GET', headers });
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout após 15 segundos')), 15000)
  );

  const response = await Promise.race([fetchPromise, timeoutPromise]);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const text = await response.text();
  const lines = text.split(/\r?\n/).slice(0, maxLines);
  
  // Verifica se é M3U válido
  if (!lines[0] || !lines[0].startsWith('#EXTM3U')) {
    throw new Error('Formato M3U inválido: cabeçalho #EXTM3U não encontrado');
  }

  // Conta rapidamente categorias nas primeiras linhas
  let liveCount = 0;
  let moviesCount = 0;
  let seriesCount = 0;
  const groupTitles = new Set();
  const groupTitleCounts = new Map(); // Conta quantas vezes cada group-title aparece

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#EXTINF:')) {
      const groupMatch = lines[i].match(/group-title="([^"]+)"/i);
      const nameMatch = lines[i].match(/,(.+)$/);
      const groupTitle = groupMatch ? groupMatch[1] : '';
      const groupTitleLower = groupTitle.toLowerCase();
      const itemName = nameMatch ? nameMatch[1].toLowerCase() : '';
      const combined = `${groupTitleLower} ${itemName}`;

      if (groupTitle) {
        groupTitles.add(groupTitle);
        groupTitleCounts.set(groupTitle, (groupTitleCounts.get(groupTitle) || 0) + 1);
      }

      // Categorização melhorada
      let categorized = false;

      // Filmes - verifica primeiro (prioridade)
      const movieKeywords = ['movie', 'filme', 'cinema', 'film', 'película', 'pelicula', 'vod', 'video on demand', 'movies', 'filmes', 'longa', 'feature'];
      for (const keyword of movieKeywords) {
        if (groupTitleLower.includes(keyword) || itemName.includes(keyword)) {
          moviesCount++;
          categorized = true;
          break;
        }
      }

      // Séries - verifica segundo
      if (!categorized) {
        const seriesKeywords = ['series', 'série', 'serie', 'tv show', 'show', 'shows', 'episode', 'episódio', 'episodio', 'season', 'temporada', 'seriado', 'telenovela', 'novela', 'drama', 'comedy', 'comédia', 'anime', 'cartoon'];
        const seriesPatterns = [/s\d+e\d+/i, /t\d+e\d+/i, /temporada\s*\d+/i, /season\s*\d+/i, /epis[oó]dio\s*\d+/i, /ep\.?\s*\d+/i];
        
        let isSeries = false;
        for (const keyword of seriesKeywords) {
          if (groupTitleLower.includes(keyword) || itemName.includes(keyword)) {
            isSeries = true;
            break;
          }
        }
        if (!isSeries) {
          for (const pattern of seriesPatterns) {
            if (pattern.test(combined)) {
              isSeries = true;
              break;
            }
          }
        }
        
        if (isSeries) {
          seriesCount++;
          categorized = true;
        }
      }

      // Canais ao vivo - padrão
      if (!categorized) {
        liveCount++;
      }
    }
  }

  // Ordena group-titles por frequência
  const sortedGroupTitles = Array.from(groupTitleCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([title, count]) => `${title} (${count}x)`);

  return {
    live: liveCount,
    movies: moviesCount,
    series: seriesCount,
    groupTitles: sortedGroupTitles,
    sampleSize: lines.length,
    totalGroupTitles: groupTitles.size,
  };
};

/**
 * Endpoint de diagnóstico para testar configuração IPTV
 */
router.post('/test-iptv', authenticateToken, async (req, res) => {
  // Timeout geral de 30 segundos
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({
        success: false,
        error: 'Timeout: O teste demorou mais de 30 segundos. A playlist pode ser muito grande.',
      });
    }
  }, 30000);

  try {
    const { baseUrl, username, password } = req.body;

    if (!baseUrl || !username || !password) {
      clearTimeout(timeout);
      return res.status(400).json({
        success: false,
        error: 'baseUrl, username e password são obrigatórios',
      });
    }

    const results = {
      baseUrl,
      username,
      tests: [],
      success: false,
    };

    // Teste 1: Verificar se a URL é acessível
    try {
      const fetchPromise = fetch(baseUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'ULTRAIPTV-Backend/1.0',
        },
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout após 5 segundos')), 5000)
      );
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      results.tests.push({
        name: 'Acessibilidade da URL base',
        success: true,
        status: response.status,
        message: `URL acessível (Status: ${response.status})`,
      });
    } catch (error) {
      results.tests.push({
        name: 'Acessibilidade da URL base',
        success: false,
        message: error.message,
      });
    }

    // Teste 2: Tentar padrões M3U
    const m3uPatterns = [
      {
        name: 'Padrão 1: get.php?username=...&password=...&type=m3u_plus',
        url: `${baseUrl}?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&type=m3u_plus&output=m3u8`,
      },
      {
        name: 'Padrão 2: /get.php?username=...&password=...',
        url: `${baseUrl.replace(/\/+$/, '')}/get.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&type=m3u_plus`,
      },
      {
        name: 'Padrão 3: get.php?username=...&password=...&type=m3u',
        url: `${baseUrl}?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&type=m3u`,
      },
      {
        name: 'Padrão 4: /playlist.m3u?username=...&password=...',
        url: `${baseUrl.replace(/\/+$/, '')}/playlist.m3u?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      },
    ];

    let m3uSuccess = false;
    for (const pattern of m3uPatterns) {
      try {
        // Usa parse rápido para teste (apenas primeiras 1000 linhas)
        const parsed = await quickParseM3U(pattern.url, username, password, 1000);
        const groupTitlesInfo = parsed.groupTitles.length > 0 
          ? `\n\nGroup-titles mais comuns:\n${parsed.groupTitles.slice(0, 10).join('\n')}`
          : '';
        
        results.tests.push({
          name: pattern.name,
          success: true,
          url: pattern.url,
          message: `✅ Sucesso! Estimativa (primeiras ${parsed.sampleSize} linhas): ${parsed.live} canais, ${parsed.movies} filmes, ${parsed.series} séries${groupTitlesInfo}`,
          data: {
            channels: parsed.live,
            movies: parsed.movies,
            series: parsed.series,
            groupTitles: parsed.groupTitles,
            totalGroupTitles: parsed.totalGroupTitles,
          },
        });
        m3uSuccess = true;
        results.workingUrl = pattern.url;
        break;
      } catch (error) {
        results.tests.push({
          name: pattern.name,
          success: false,
          url: pattern.url,
          message: `❌ ${error.message}`,
        });
      }
    }

    // Teste 3: Tentar como API Xtream
    if (!m3uSuccess) {
      try {
        const xtreamUrl = `${baseUrl.replace(/\/+$/, '')}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_live_streams`;
        const fetchPromise = fetch(xtreamUrl);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout após 5 segundos')), 5000)
        );
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        if (response.ok) {
          const data = await response.json();
          results.tests.push({
            name: 'API Xtream (player_api.php)',
            success: true,
            url: xtreamUrl,
            message: `✅ API Xtream funcionando! Resposta recebida.`,
          });
          results.workingUrl = xtreamUrl;
          m3uSuccess = true;
        } else {
          results.tests.push({
            name: 'API Xtream (player_api.php)',
            success: false,
            url: xtreamUrl,
            message: `❌ Status: ${response.status}`,
          });
        }
      } catch (error) {
        results.tests.push({
          name: 'API Xtream (player_api.php)',
          success: false,
          message: `❌ ${error.message}`,
        });
      }
    }

    results.success = m3uSuccess;
    clearTimeout(timeout);

    if (m3uSuccess) {
      res.json(results);
    } else {
      res.status(400).json({
        ...results,
        error: 'Nenhum padrão funcionou. Verifique a URL, usuário e senha.',
      });
    }
  } catch (error) {
    clearTimeout(timeout);
    console.error('[DIAGNOSTIC] Erro:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
});

module.exports = router;

