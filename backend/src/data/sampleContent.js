module.exports = {
  live: [
    {
      id: 'live-ultra-news',
      name: 'Ultra News HD',
      logo: 'https://cdn.pixabay.com/photo/2013/07/13/12/07/news-159176_1280.png',
      stream_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      direct_url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
      category: 'Notícias'
    },
    {
      id: 'live-sports-max',
      name: 'Sports Max 24/7',
      logo: 'https://cdn.pixabay.com/photo/2016/11/22/21/42/american-football-1851160_1280.png',
      stream_url: 'https://moiptvhls-i.akamaihd.net/hls/live/652034/moiptv/master.m3u8',
      direct_url: 'https://cdn.bitmovin.com/content/assets/mmafight/playlist.m3u8',
      category: 'Esportes'
    },
    {
      id: 'live-music-vibes',
      name: 'Music Vibes',
      logo: 'https://cdn.pixabay.com/photo/2016/11/19/14/00/headphones-1836337_1280.png',
      stream_url: 'https://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8',
      direct_url: 'https://mnmedias.api.telequebec.tv/m3u8/29880.m3u8',
      category: 'Música'
    }
  ],
  movies: [
    {
      id: 'movie-sintel',
      title: 'Sintel',
      poster: 'https://mango.blender.org/wp-content/uploads/2013/05/Sintel_poster-686x1024.jpg',
      stream_url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
      direct_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      description: 'Animação épica da Fundação Blender',
      year: 2010
    },
    {
      id: 'movie-bunny',
      title: 'Big Buck Bunny',
      poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Big.Buck.Bunny.-.Titre.png/800px-Big.Buck.Bunny.-.Titre.png',
      stream_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      direct_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      description: 'Clássico open movie da Blender Foundation',
      year: 2008
    },
    {
      id: 'movie-tears',
      title: 'Tears of Steel',
      poster: 'https://mango.blender.org/wp-content/themes/mango/library/images/press/ToS_Poster_web.jpg',
      stream_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.m3u8',
      direct_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      description: 'Ficção científica produzida na Holanda',
      year: 2012
    }
  ],
  series: [
    {
      id: 'series-cosmos',
      title: 'Cosmos Stories',
      poster: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?auto=format&fit=crop&w=600&q=60',
      description: 'Documentários sobre o universo',
      seasons: [
        {
          id: 'series-cosmos-s1',
          number: 1,
          episodes: [
            {
              id: 'cosmos-s1-e1',
              number: 1,
              title: 'Além da Atmosfera',
              stream_url: 'https://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8',
              direct_url: 'https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/hls.m3u8'
            },
            {
              id: 'cosmos-s1-e2',
              number: 2,
              title: 'A Dança dos Planetas',
              stream_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
              direct_url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8'
            }
          ]
        }
      ]
    },
    {
      id: 'series-cyber',
      title: 'Cyber Unit',
      poster: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=60',
      description: 'Série de investigação digital',
      seasons: [
        {
          id: 'series-cyber-s1',
          number: 1,
          episodes: [
            {
              id: 'cyber-s1-e1',
              number: 1,
              title: 'Invasão',
              stream_url: 'https://d3cwccg7mi8onu.cloudfront.net/hls/Se7en.m3u8',
              direct_url: 'https://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8'
            },
            {
              id: 'cyber-s1-e2',
              number: 2,
              title: 'Ransom',
              stream_url: 'https://mnmedias.api.telequebec.tv/m3u8/29880.m3u8',
              direct_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
            }
          ]
        }
      ]
    }
  ],
  epg: [
    {
      id: 'epg-ultra-news-1',
      channel: 'Ultra News HD',
      title: 'Jornal da Manhã',
      description: 'Principais manchetes com análises ao vivo.',
      start: new Date().toISOString(),
      end: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'epg-sports-1',
      channel: 'Sports Max 24/7',
      title: 'Arena Ultra',
      description: 'Pós-jogo com entrevistas exclusivas.',
      start: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      end: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'epg-music-1',
      channel: 'Music Vibes',
      title: 'Playlist Neon',
      description: 'Os maiores hits eletrônicos da semana.',
      start: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      end: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    },
  ]
};


