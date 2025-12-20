import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  RefreshControl,
  Dimensions,
  ScrollView,
  TextInput,
  Pressable,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Linking } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { API_ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppLogo from '../src/components/AppLogo';
import { palette } from '../src/theme/palette';
import { useSettings } from '../src/context/SettingsContext';
import { useIptvConfig } from '../src/context/IptvContext';
import { buildIptvHeaders } from '../src/utils/iptv';
import { Ionicons } from '@expo/vector-icons';

interface Movie {
  id: string;
  title: string;
  poster?: string;
  stream_url: string;
  direct_url?: string;
  description?: string;
  year?: number;
  category?: string;
}

export default function MoviesScreen() {
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [catOffset, setCatOffset] = useState(0);
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [catQuery, setCatQuery] = useState('');
  const [recentMovies, setRecentMovies] = useState<Movie[]>([]);
  const [showRecent, setShowRecent] = useState(true);
  const [selectedRecentIds, setSelectedRecentIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const { settings } = useSettings();
  const { config: iptvConfig, loading: iptvLoading, activeId } = useIptvConfig();
  const [numColumns, setNumColumns] = useState(Math.max(2, Math.floor(Dimensions.get('window').width / 200)));
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setNumColumns(Math.max(2, Math.floor(window.width / 200)));
    });
    return () => { (sub as any)?.remove?.(); };
  }, []);

  useEffect(() => {
    if (iptvConfig) {
      loadMovies();
    } else {
      setLoading(false);
    }
  }, [iptvConfig]);

  useFocusEffect(
    useCallback(() => {
      console.log('[MOVIES] useFocusEffect - Carregando assistidos recentes');
      loadRecentMovies();
      if (settings.autoRefreshContent && iptvConfig) {
        loadMovies(1, true);
      }
    }, [settings.autoRefreshContent, iptvConfig])
  );

  const loadRecentMovies = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem('@ultraiptv_recent_watched_movies');
      if (raw) {
        const items = JSON.parse(raw);
        if (Array.isArray(items) && items.length > 0) {
          const sorted = items.sort((a: any, b: any) => (b.lastWatched || 0) - (a.lastWatched || 0));
          // Manter os dados completos incluindo position para retomar de onde parou
          const moviesList: any[] = sorted.slice(0, 20).map((item: any) => ({
            id: item.sid || item.id,
            title: item.title || 'Sem título',
            poster: item.poster || item.logo || item.poster_url || '',
            stream_url: item.stream_url || item.url || '',
            direct_url: item.direct_url || '',
            category: item.category || '',
            year: undefined,
            description: undefined,
            position: item.position || 0, // Manter posição salva
            duration: item.duration || 0, // Manter duração salva
          }));
          setRecentMovies(moviesList);
          console.log('[MOVIES] Assistidos recentes carregados:', moviesList.length);
          return;
        }
      }
      setRecentMovies([]);
    } catch (error) {
      console.error('Erro ao carregar filmes recentes:', error);
      setRecentMovies([]);
    }
  }, []);

  const handleDeleteRecent = async (movieId: string) => {
    console.log('[DELETE] handleDeleteRecent chamado com ID:', movieId, 'isSelectMode:', isSelectMode);
    
    if (isSelectMode) {
      // Modo seleção - adicionar/remover da seleção
      const newSelected = new Set(selectedRecentIds);
      if (newSelected.has(movieId)) {
        newSelected.delete(movieId);
      } else {
        newSelected.add(movieId);
      }
      setSelectedRecentIds(newSelected);
      return;
    }

    // Executar exclusão diretamente (igual ao de séries)
    try {
      const raw = await AsyncStorage.getItem('@ultraiptv_recent_watched_movies');
      if (!raw) {
        Alert.alert('Aviso', 'Nenhum filme encontrado para remover.');
        return;
      }
      
      const items = JSON.parse(raw);
      if (!Array.isArray(items) || items.length === 0) {
        Alert.alert('Aviso', 'Nenhum filme encontrado para remover.');
        return;
      }
      
      console.log('[DELETE] ===== INÍCIO DA EXCLUSÃO (FILME) =====');
      console.log('[DELETE] ID recebido:', movieId, 'Tipo:', typeof movieId);
      console.log('[DELETE] Total de itens antes:', items.length);
      console.log('[DELETE] IDs no storage:', items.map((i: any, idx: number) => ({
        index: idx,
        sid: i.sid,
        id: i.id,
        title: i.title,
        sidType: typeof i.sid,
        idType: typeof i.id,
      })));
      
      // Tentar todas as formas possíveis de comparação
      const targetId = String(movieId || '').trim();
      let foundIndex = -1;
      let foundItem: any = null;
      
      // Buscar o item usando múltiplas estratégias
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemSid = String(item.sid || '').trim();
        const itemId = String(item.id || '').trim();
        const itemSidRaw = item.sid;
        const itemIdRaw = item.id;
        
        // Comparações múltiplas
        if (
          itemSid === targetId ||
          itemId === targetId ||
          itemSidRaw === movieId ||
          itemIdRaw === movieId ||
          String(itemSidRaw) === String(movieId) ||
          String(itemIdRaw) === String(movieId) ||
          itemSid === String(movieId) ||
          itemId === String(movieId)
        ) {
          foundIndex = i;
          foundItem = item;
          console.log('[DELETE] ✅ Item encontrado no índice', i, ':', {
            title: item.title,
            sid: item.sid,
            id: item.id,
            targetId,
            movieId,
          });
          break;
        }
      }
      
      if (foundIndex === -1) {
        console.log('[DELETE] ❌ Item NÃO encontrado. Tentando busca mais ampla...');
        // Tentar buscar pelo índice na lista de recentMovies
        const movieIndex = recentMovies.findIndex(m => String(m.id) === String(movieId));
        if (movieIndex >= 0) {
          const movie = recentMovies[movieIndex];
          console.log('[DELETE] Filme encontrado na lista local:', movie);
          // Tentar encontrar no storage usando o título
          const foundByTitle = items.findIndex((i: any) => 
            String(i.title || '').trim() === String(movie.title || '').trim()
          );
          if (foundByTitle >= 0) {
            foundIndex = foundByTitle;
            foundItem = items[foundByTitle];
            console.log('[DELETE] ✅ Item encontrado pelo título no índice', foundIndex);
          }
        }
      }
      
      if (foundIndex === -1 || !foundItem) {
        Alert.alert(
          'Filme não encontrado',
          `Não foi possível encontrar o filme na lista.\n\nID procurado: ${movieId}\n\nTotal de itens: ${items.length}`
        );
        return;
      }
      
      // Remover o item encontrado
      const filtered = items.filter((_: any, index: number) => index !== foundIndex);
      console.log('[DELETE] Itens depois da remoção:', filtered.length);
      
      await AsyncStorage.setItem('@ultraiptv_recent_watched_movies', JSON.stringify(filtered));
      
      // Remover progresso - tentar com diferentes formatos de ID
      try {
        const progressKeys = [
          `@ultraiptv_progress_movie_${movieId}`,
          `@ultraiptv_progress_movie_${targetId}`,
          `@ultraiptv_progress_movie_${foundItem.sid}`,
          `@ultraiptv_progress_movie_${foundItem.id}`,
        ];
        for (const key of progressKeys) {
          await AsyncStorage.removeItem(key);
        }
        console.log('[DELETE] Progresso removido');
      } catch (e) {
        console.warn('[DELETE] Erro ao remover progresso:', e);
      }
      
      // Recarregar lista
      await loadRecentMovies();
      console.log('[DELETE] ===== EXCLUSÃO CONCLUÍDA (FILME) =====');
      Alert.alert('Sucesso', 'Filme removido dos assistidos recentes.');
    } catch (error: any) {
      console.error('[DELETE] Erro ao remover filme:', error);
      Alert.alert('Erro', `Não foi possível remover o filme: ${error?.message || error}`);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRecentIds.size === 0) {
      Alert.alert('Aviso', 'Selecione pelo menos um filme para remover.');
      return;
    }

    const count = selectedRecentIds.size;
    Alert.alert(
      'Remover filmes',
      `Deseja remover ${count} filme(s) dos assistidos recentes?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              const raw = await AsyncStorage.getItem('@ultraiptv_recent_watched_movies');
              if (raw) {
                const items = JSON.parse(raw);
                // Filtrar removendo os selecionados - comparar com sid e id
                const filtered = items.filter((item: any) => {
                  const itemSid = String(item.sid || '').trim();
                  const itemId = String(item.id || '').trim();
                  // Verificar se o item está na lista de selecionados
                  return !Array.from(selectedRecentIds).some(selectedId => {
                    const targetId = String(selectedId || '').trim();
                    return itemSid === targetId || itemId === targetId || 
                           String(item.sid) === String(selectedId) || 
                           String(item.id) === String(selectedId);
                  });
                });
                
                await AsyncStorage.setItem('@ultraiptv_recent_watched_movies', JSON.stringify(filtered));
                
                // Remover progressos dos selecionados
                for (const selectedId of selectedRecentIds) {
                  try {
                    const progressKey1 = `@ultraiptv_progress_movie_${selectedId}`;
                    const progressKey2 = `@ultraiptv_progress_movie_${String(selectedId).trim()}`;
                    await AsyncStorage.removeItem(progressKey1);
                    await AsyncStorage.removeItem(progressKey2);
                  } catch (e) {
                    console.warn('Erro ao remover progresso:', e);
                  }
                }
                
                setSelectedRecentIds(new Set());
                setIsSelectMode(false);
                await loadRecentMovies();
                Alert.alert('Sucesso', `${count} filme(s) removido(s) dos assistidos recentes.`);
              }
            } catch (error: any) {
              console.error('Erro ao remover filmes:', error);
              Alert.alert('Erro', `Não foi possível remover os filmes: ${error?.message || error}`);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (iptvConfig) {
      (async () => {
        setLoading(true);
        try {
          const key = `@ultraiptv_movies_cache:${activeId || 'default'}:${selectedCategory}`;
          const raw = await AsyncStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            // Verifica se o cache tem menos de 5 minutos
            const cacheAge = Date.now() - (parsed.ts || 0);
            const isCacheValid = cacheAge < 5 * 60 * 1000; // 5 minutos
            if (Array.isArray(parsed?.items) && parsed.items.length > 0 && isCacheValid) {
              setMovies(parsed.items);
              if (Array.isArray(parsed.categories)) setCategories(parsed.categories);
              setLoading(false);
              // Carrega atualizações em background
              loadMovies(1, true);
              return;
            }
          }
        } catch {}
        setMovies([]);
        setPage(1);
        setHasMore(true);
        loadMovies(1, true);
      })();
    } else {
      setLoading(false);
    }
  }, [selectedCategory, iptvConfig, activeId]);

  const filterMovies = (list: Movie[]) => {
    if (!settings.parentalControlEnabled) return list;
    return list.filter((item) => {
      const target = `${item.category || ''} ${item.title} ${item.description || ''}`.toLowerCase();
      return !settings.blockedKeywords.some((keyword) =>
        target.includes(keyword.toLowerCase())
      );
    });
  };

  const loadMovies = useCallback(async (nextPage: number = 1, reset: boolean = false) => {
    if (!iptvConfig) {
      Alert.alert('Playlist necessária', 'Configure sua playlist IPTV no dashboard para carregar filmes.');
      setLoading(false);
      return;
    }
    try {
      const token = await AsyncStorage.getItem('@ultraiptv_token');
      
      if (!token) {
        Alert.alert('Erro', 'Token de autenticação não encontrado. Faça login novamente.');
        router.replace('/login');
        return;
      }
      
      setRefreshing(true);

      const params = new URLSearchParams();
      params.set('page', String(nextPage));
      params.set('limit', String(nextPage === 1 ? 80 : 200));
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      const response = await fetch(`${API_ENDPOINTS.MOVIES}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...buildIptvHeaders(iptvConfig),
        },
      });
      
      console.log('[MOVIES] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[MOVIES] Dados recebidos:', {
          isArray: Array.isArray(data),
          hasMovies: !!data.movies,
          moviesCount: data.movies?.length || 0,
          source: data.source,
          page: data.page,
          limit: data.limit,
          total: data.total,
          hasMore: data.hasMore,
        });
        
        const list = Array.isArray(data) ? data : data.movies || [];
        const filtered = filterMovies(list);
        const nextItems = (await Promise.resolve(filtered));
        setMovies((prev) => {
          const merged = reset ? nextItems : [...prev, ...nextItems];
          const serverCategories = Array.isArray((data as any).categories) ? (data as any).categories : [];
          // Filtra categorias vazias e duplicadas, mantém apenas plataformas
          const uniqueCategories = Array.from(new Set(merged.map((m) => m.category).filter(Boolean))) as string[];
          const cats = serverCategories.length > 0
            ? serverCategories.filter((c: string) => c && c.trim() !== '')
            : uniqueCategories;
          setCategories(cats);
          try {
            const key = `@ultraiptv_movies_cache:${activeId || 'default'}:${selectedCategory}`;
            AsyncStorage.setItem(key, JSON.stringify({ items: merged, categories: cats, ts: Date.now() }));
          } catch {}
          return merged;
        });
        setPage(nextPage);
        setHasMore(Boolean(data.hasMore));
        // Removido carregamento automático da página 2 para melhorar performance
        if (filtered.length === 0) {
          if (list.length > 0) {
            Alert.alert(
              'Aviso', 
              `Nenhum filme disponível após filtro de controle dos pais.\n\nTotal de filmes: ${list.length}\nFiltrados: ${filtered.length}\n\nDesative o controle dos pais nas configurações para ver todos os filmes.`
            );
          } else {
            Alert.alert(
              'Aviso', 
              'Nenhum filme disponível no momento.\n\nVerifique:\n• Se a playlist M3U contém filmes\n• Se o group-title está correto (deve conter "movie", "filme", "vod")\n• Se a URL da playlist está acessível'
            );
          }
        } else {
          console.log('[MOVIES] ✅ Filmes carregados com sucesso:', filtered.length);
        }
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          const errorText = await response.text();
          errorData = { message: errorText };
        }
        console.error('Erro ao carregar filmes:', response.status, errorData);
        Alert.alert(
          'Erro ao carregar filmes',
          errorData.error || errorData.message || `Status: ${response.status}\n\nVerifique se a URL da playlist está correta e acessível.`
        );
      }
    } catch (error: any) {
      console.error('Erro ao carregar filmes:', error);
      Alert.alert('Erro', `Erro ao conectar com a API: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [iptvConfig, selectedCategory, settings.parentalControlEnabled, settings.blockedKeywords, activeId, router]);

  const handleMoviePress = async (movie: any) => {
    const playbackUrl = settings.streamFormat === 'direct' && movie.direct_url ? movie.direct_url : movie.stream_url;
    if (!playbackUrl) {
      Alert.alert('Erro', 'Este item não possui URL de stream disponível.');
      return;
    }
    let ext = (playbackUrl.split('.').pop() || '').split('?')[0];
    ext = (!ext || ext.toLowerCase() === 'null' || ext.toLowerCase() === 'undefined' || /[^a-z0-9]/i.test(ext) || ext.length > 4) ? 'mp4' : ext.toLowerCase();
    
    // Buscar progresso salvo - priorizar position do item recente, depois do storage
    let savedProgress = null;
    
    // Primeiro, verificar se o item tem position (vindo de Assistidos Recentes)
    if (movie.position && movie.position > 0) {
      const percentage = movie.duration > 0 ? (movie.position / movie.duration) * 100 : 0;
      if (percentage < 90) {
        savedProgress = movie.position;
        console.log(`[MOVIES] ✅ Progresso encontrado no item recente: ${savedProgress.toFixed(1)}s (${percentage.toFixed(1)}%)`);
      }
    }
    
    // Se não encontrou no item, buscar no storage
    if (!savedProgress) {
      try {
        const progressKey = `@ultraiptv_progress_movie_${movie.id}`;
        const progressRaw = await AsyncStorage.getItem(progressKey);
        if (progressRaw) {
          const progress = JSON.parse(progressRaw);
          if (progress.position && progress.duration) {
            const percentage = (progress.position / progress.duration) * 100;
            if (percentage < 90) {
              savedProgress = progress.position;
              console.log(`[MOVIES] ✅ Progresso encontrado no storage: ${savedProgress.toFixed(1)}s`);
            }
          }
        }
      } catch {}
    }
    
    const playbackData: any = { 
      uri: playbackUrl, 
      title: movie.title, 
      type: 'movie', 
      sid: movie.id, 
      ext,
      poster: movie.poster || '',
      category: movie.category || '',
    };
    
    if (savedProgress) {
      playbackData.savedPosition = savedProgress;
      console.log(`[MOVIES] Retomando filme de ${savedProgress.toFixed(1)}s`);
    }
    
    try { 
      AsyncStorage.setItem('@ultraiptv_playback', JSON.stringify(playbackData)); 
    } catch {}
    try { 
      if (typeof window !== 'undefined') { 
        window.sessionStorage.setItem('ultraiptv_playback', JSON.stringify(playbackData)); 
      } 
    } catch {}

    try {
      const items = filteredMovies.map((m) => {
        const u = settings.streamFormat === 'direct' && m.direct_url ? m.direct_url : m.stream_url;
        let e = (u.split('.').pop() || '').split('?')[0];
        e = (!e || e.toLowerCase() === 'null' || e.toLowerCase() === 'undefined' || /[^a-z0-9]/i.test(e) || e.length > 4) ? 'mp4' : e.toLowerCase();
        return { uri: u, title: m.title, sid: m.id, ext: e };
      });
      const index = items.findIndex((it) => String(it.sid) === String(movie.id));
      const store = { items, index: index >= 0 ? index : 0 };
      // Salva em ambos os lugares (web e mobile)
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('ultraiptv_movies_playlist', JSON.stringify(store));
      }
      await AsyncStorage.setItem('@ultraiptv_movies_playlist', JSON.stringify(store));
    } catch (error) {
      console.error('Erro ao salvar playlist de filmes:', error);
    }
    
    // Construir URL com savedPosition se existir
    let url = `/player?uri=${encodeURIComponent(playbackUrl)}&title=${encodeURIComponent(movie.title)}&type=movie&sid=${encodeURIComponent(movie.id)}&ext=${encodeURIComponent(ext)}&from=movies`;
    if (movie.poster) {
      url += `&poster=${encodeURIComponent(movie.poster)}`;
    }
    if (movie.category) {
      url += `&category=${encodeURIComponent(movie.category)}`;
    }
    if (savedProgress) {
      url += `&savedPosition=${savedProgress}`;
    }
    router.push(url);
  };

  const handleAddFavorite = async (movie: Movie) => {
    try {
      const raw = await AsyncStorage.getItem('@ultraiptv_favorites_movies');
      const list = raw ? JSON.parse(raw) : [];
      const exists = list.some((m: any) => String(m.id) === String(movie.id));
      const next = exists ? list : [{ id: movie.id, title: movie.title, poster: movie.poster }, ...list];
      await AsyncStorage.setItem('@ultraiptv_favorites_movies', JSON.stringify(next));
      Alert.alert('Favoritos', 'Adicionado aos favoritos.');
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Não foi possível adicionar aos favoritos.');
    }
  };

  const handleOpenTrailer = async (movie: Movie) => {
    const q = encodeURIComponent(`${movie.title} trailer oficial`);
    const url = `https://www.youtube.com/results?search_query=${q}`;
    try {
      await Linking.openURL(url);
    } catch {}
  };

  const renderMovie = ({ item }: { item: Movie }) => (
    <TouchableOpacity
      style={styles.movieItem}
      onPress={() => handleMoviePress(item)}
      activeOpacity={0.7}
    >
      {item.poster ? (
        <Image source={{ uri: item.poster }} style={styles.moviePoster} />
      ) : (
        <View style={styles.moviePosterPlaceholder}>
          <Text style={styles.moviePosterText}>🎬</Text>
        </View>
      )}
      <Text style={styles.movieTitle} numberOfLines={2}>
        {item.title}
      </Text>
      {item.year && (
        <Text style={styles.movieYear}>{item.year}</Text>
      )}
    </TouchableOpacity>
  );

  useEffect(() => {
    const onKey = (e: any) => {
      if (selectedMovie) {
        if (e.key === 'Escape' || e.key === 'Backspace') {
          setSelectedMovie(null);
        }
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [selectedMovie]);

  useEffect(() => {
    const BackHandler = require('react-native').BackHandler;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectedMovie) {
        setSelectedMovie(null);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [selectedMovie]);

  if (iptvLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={styles.loadingText}>Carregando filmes...</Text>
      </View>
    );
  }

  if (!iptvConfig) {
    return (
      <View style={styles.loadingContainer}>
        <AppLogo size={110} />
        <Text style={[styles.loadingText, { marginTop: 20 }]}>
          Adicione sua playlist IPTV para liberar a biblioteca de filmes.
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { marginTop: 24, width: 220 }]}
          onPress={() => router.push('/dashboard')}
        >
          <Text style={styles.backButtonText}>Configurar playlist</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const filteredMovies = movies
    .filter((m) => selectedCategory === 'all' ? true : m.category === selectedCategory)
    .filter((m) => searchQuery ? (m.title || '').toLowerCase().includes(searchQuery.toLowerCase()) : true);

  if (selectedMovie) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setSelectedMovie(null)}>
            <Ionicons name="arrow-back" size={28} color={palette.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <AppLogo size={72} />
            <Text style={styles.headerTitle}>{selectedMovie.title}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerBadge}>{selectedMovie.year || ''}</Text>
          </View>
        </View>

        <View style={styles.detailContainer}>
          {selectedMovie.poster ? (
            <Image source={{ uri: selectedMovie.poster }} style={styles.detailPoster} />
          ) : (
            <View style={styles.detailPosterPlaceholder}>
              <Text style={styles.moviePosterText}>🎬</Text>
            </View>
          )}
          <View style={styles.detailInfo}>
            <Text style={styles.detailTitle}>{selectedMovie.title}</Text>
            {selectedMovie.category && (
              <Text style={styles.detailMeta}>{selectedMovie.category}</Text>
            )}
            {selectedMovie.year && (
              <Text style={styles.detailMeta}>Ano: {selectedMovie.year}</Text>
            )}
            {selectedMovie.description && (
              <Text style={styles.detailDescription} numberOfLines={6}>{selectedMovie.description}</Text>
            )}
            <View style={styles.detailActions}>
              <TouchableOpacity style={[styles.actionPrimary, { backgroundColor: '#d60000' }]} onPress={() => handleMoviePress(selectedMovie)}>
                <Text style={styles.actionPrimaryText}>ASSISTIR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionSecondary, { backgroundColor: '#f0c400' }]} onPress={() => handleAddFavorite(selectedMovie)}>
                <Text style={styles.actionSecondaryText}>ADICIONAR AOS FAVORITOS</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionSecondary, { backgroundColor: '#0066cc' }]} onPress={() => handleOpenTrailer(selectedMovie)}>
                <Text style={styles.actionSecondaryText}>TRAILER</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <AppLogo size={80} />
          <Text style={styles.headerTitle}>Filmes</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerBadge}
          >
            {movies.length} títulos
          </Text>
        </View>
      </View>

      {categories.length > 0 && (
        <View style={styles.categoriesContainer}>
          <View style={styles.categoryBar}>
            <TouchableOpacity
              style={[styles.categoryArrow, catOffset <= 0 && styles.categoryArrowDisabled]}
              onPress={() => setCatOffset(Math.max(0, catOffset - Math.max(4, Math.floor(Dimensions.get('window').width / 200))))}
              disabled={catOffset <= 0}
            >
              <Text style={styles.categoryArrowText}>◀</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.categoryButton, selectedCategory === 'all' && styles.categoryButtonActive]}
              onPress={() => setSelectedCategory('all')}
            >
              <Text style={[styles.categoryText, selectedCategory === 'all' && styles.categoryTextActive]}>Todos</Text>
            </TouchableOpacity>
            {categories.slice(catOffset, catOffset + Math.max(4, Math.floor(Dimensions.get('window').width / 200))).map((category) => (
              <TouchableOpacity
                key={category}
                style={[styles.categoryButton, selectedCategory === category && styles.categoryButtonActive]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[styles.categoryText, selectedCategory === category && styles.categoryTextActive]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
            style={[styles.categoryArrow, (catOffset + Math.max(4, Math.floor(Dimensions.get('window').width / 200)) >= categories.length) && styles.categoryArrowDisabled]}
            onPress={() => setCatOffset(Math.min(Math.max(0, categories.length - Math.max(4, Math.floor(Dimensions.get('window').width / 200))), catOffset + Math.max(4, Math.floor(Dimensions.get('window').width / 200))))}
            disabled={catOffset + Math.max(4, Math.floor(Dimensions.get('window').width / 200)) >= categories.length}
            >
              <Text style={styles.categoryArrowText}>▶</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.openPickerButton} onPress={() => setShowCatPicker(true)}>
              <Text style={styles.openPickerText}>Categorias</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.searchContainer}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Pesquisar filmes"
          placeholderTextColor={palette.textSecondary}
          style={styles.searchInput}
        />
      </View>

      {/* Seção de Assistidos Recentes */}
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Assistidos Recentes</Text>
          <View style={styles.recentHeaderActions}>
            {isSelectMode && selectedRecentIds.size > 0 && (
              <TouchableOpacity 
                style={styles.recentDeleteSelectedButton}
                onPress={handleDeleteSelected}
              >
                <Text style={styles.recentDeleteSelectedText}>
                  Remover ({selectedRecentIds.size})
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              onPress={() => {
                setIsSelectMode(!isSelectMode);
                setSelectedRecentIds(new Set());
              }}
            >
              <Text style={styles.recentToggle}>
                {isSelectMode ? 'Cancelar' : 'Selecionar'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowRecent(!showRecent)}>
              <Text style={styles.recentToggle}>{showRecent ? 'Ocultar' : 'Mostrar'}</Text>
            </TouchableOpacity>
          </View>
        </View>
        {showRecent && recentMovies.length > 0 && (
          <FlatList
            horizontal
            data={recentMovies}
            keyExtractor={(item, idx) => `recent_${item.id}_${idx}`}
            renderItem={({ item, index }) => {
              const isSelected = selectedRecentIds.has(item.id);
              return (
                <View style={styles.recentItem}>
                  <TouchableOpacity
                    style={[
                      styles.recentItemContent,
                      isSelected && styles.recentItemSelected
                    ]}
                    onPress={() => {
                      if (isSelectMode) {
                        handleDeleteRecent(item.id);
                      } else {
                        handleMoviePress(item);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    {item.poster ? (
                      <Image source={{ uri: item.poster }} style={styles.recentItemImage} />
                    ) : (
                      <View style={styles.recentItemPlaceholder}>
                        <Text style={styles.recentItemPlaceholderText}>🎬</Text>
                      </View>
                    )}
                    {isSelectMode && (
                      <View style={[
                        styles.recentItemCheckbox,
                        isSelected && styles.recentItemCheckboxSelected
                      ]}>
                        <Text style={styles.recentItemCheckboxText}>
                          {isSelected ? '✓' : ''}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.recentItemTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                    {!isSelectMode && (
                      <Pressable
                        style={styles.recentDeleteButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          console.log('[DELETE] Botão de exclusão pressionado para filme ID:', item.id, 'Index:', index);
                          handleDeleteRecent(item.id);
                        }}
                        onStartShouldSetResponder={() => true}
                        onResponderTerminationRequest={() => false}
                        hitSlop={{ top: 50, bottom: 50, left: 50, right: 50 }}
                      >
                        <Text style={styles.recentDeleteText}>✕</Text>
                      </Pressable>
                    )}
                </View>
              );
            }}
            contentContainerStyle={styles.recentList}
            showsHorizontalScrollIndicator={false}
          />
        )}
        {showRecent && recentMovies.length === 0 && (
          <View style={styles.recentEmpty}>
            <Text style={styles.recentEmptyText}>Nenhum filme assistido recentemente</Text>
          </View>
        )}
      </View>

      <FlatList
        key={numColumns}
        data={filteredMovies}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.movieItem}
            onPress={() => setSelectedMovie(item)}
            activeOpacity={0.7}
          >
            {item.poster ? (
              <Image source={{ uri: item.poster }} style={styles.moviePoster} />
            ) : (
              <View style={styles.moviePosterPlaceholder}>
                <Text style={styles.moviePosterText}>🎬</Text>
              </View>
            )}
            <Text style={styles.movieTitle} numberOfLines={2}>
              {item.title}
            </Text>
            {item.year && (
              <Text style={styles.movieYear}>{item.year}</Text>
            )}
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        initialNumToRender={24}
        maxToRenderPerBatch={24}
        windowSize={8}
        removeClippedSubviews
        contentContainerStyle={styles.listContent}
        onEndReached={() => {
          if (hasMore && !refreshing) {
            loadMovies(page + 1);
          }
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadMovies(1, true)}
            tintColor={palette.primary}
            colors={[palette.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum filme disponível</Text>
          </View>
        }
      />

      {showCatPicker && (
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerPanel}>
            <Text style={styles.pickerTitle}>Categorias</Text>
            <TextInput
              value={catQuery}
              onChangeText={setCatQuery}
              placeholder="Pesquisar categoria"
              placeholderTextColor={palette.textSecondary}
              style={styles.pickerSearch}
            />
            <FlatList
              data={["all", ...categories].filter(c => catQuery ? c.toLowerCase().includes(catQuery.toLowerCase()) : true)}
              keyExtractor={(c) => c}
              renderItem={({ item: c }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, selectedCategory === c && styles.pickerItemActive]}
                  onPress={() => { setSelectedCategory(c); setShowCatPicker(false); setCatQuery(''); setSelectedMovie(null); }}
                >
                  <Text style={[styles.pickerItemText, selectedCategory === c && styles.pickerItemTextActive]}>
                    {c === 'all' ? 'Todos' : c}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.pickerClose} onPress={() => setShowCatPicker(false)}>
              <Text style={styles.pickerCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: palette.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 12,
  },
  backButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 224, 255, 0.2)',
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  backButtonText: {
    color: palette.primary,
    fontSize: 26,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 224, 255, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    color: palette.textPrimary,
    marginTop: 6,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 2,
  },
  headerRight: {
    minWidth: 90,
    alignItems: 'flex-end',
  },
  headerBadge: {
    color: palette.textSecondary,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    fontSize: 12,
  },
  listContent: {
    padding: 16,
    paddingBottom: 60,
  },
  categoriesContainer: {
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  categoryBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryArrow: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    marginHorizontal: 4,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  categoryArrowDisabled: {
    opacity: 0.5,
  },
  categoryArrowText: {
    color: palette.textSecondary,
    fontSize: 16,
    fontWeight: '700',
  },
  categoryButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    marginHorizontal: 4,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  categoryButtonActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  categoryText: {
    color: palette.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#00111a',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: palette.textPrimary,
    fontSize: 14,
  },
  movieItem: {
    flex: 1,
    margin: 6,
    backgroundColor: palette.surface,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  moviePoster: {
    width: '100%',
    height: 240,
    resizeMode: 'cover',
  },
  moviePosterPlaceholder: {
    width: '100%',
    height: 240,
    backgroundColor: palette.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moviePosterText: {
    fontSize: 48,
  },
  movieTitle: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    padding: 10,
    textAlign: 'center',
  },
  movieYear: {
    color: palette.textSecondary,
    fontSize: 12,
    paddingBottom: 12,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.background,
  },
  loadingText: {
    color: palette.textSecondary,
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    color: palette.textSecondary,
    fontSize: 16,
  },
  
  detailContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  detailPoster: {
    width: 260,
    height: 380,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    marginRight: 16,
  },
  detailPosterPlaceholder: {
    width: 260,
    height: 380,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    marginRight: 16,
    backgroundColor: palette.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailInfo: {
    flex: 1,
  },
  detailTitle: {
    color: palette.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  detailMeta: {
    color: palette.textSecondary,
    fontSize: 13,
    marginBottom: 6,
  },
  detailDescription: {
    color: palette.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  detailActions: {
    marginTop: 16,
    gap: 10,
  },
  actionPrimary: {
    paddingVertical: 12,
    borderRadius: 22,
    alignItems: 'center',
  },
  actionPrimaryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  actionSecondary: {
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  actionSecondaryText: {
    color: '#00111a',
    fontSize: 13,
    fontWeight: '700',
  },
  openPickerButton: {
    marginLeft: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: palette.primary,
  },
  openPickerText: {
    color: '#00111a',
    fontSize: 13,
    fontWeight: '700',
  },
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 1000,
  },
  pickerPanel: {
    width: '80%',
    maxWidth: 720,
    maxHeight: '70%',
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    padding: 16,
    zIndex: 1001,
    elevation: 1001,
  },
  pickerTitle: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  pickerSearch: {
    backgroundColor: palette.backgroundAlt,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: palette.textPrimary,
    fontSize: 14,
    marginBottom: 12,
  },
  pickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: palette.backgroundAlt,
    marginBottom: 6,
  },
  pickerItemActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  pickerItemText: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  pickerItemTextActive: {
    color: '#00111a',
  },
  pickerClose: {
    marginTop: 12,
    alignSelf: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: palette.backgroundAlt,
  },
  pickerCloseText: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  recentSection: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  recentToggle: {
    color: palette.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  recentList: {
    paddingVertical: 8,
  },
  recentItem: {
    marginRight: 12,
    width: 140,
    position: 'relative',
  },
  recentItemContent: {
    width: '100%',
    position: 'relative',
  },
  recentItemImage: {
    width: 140,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: palette.backgroundAlt,
  },
  recentItemPlaceholder: {
    width: 140,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: palette.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentItemPlaceholderText: {
    fontSize: 48,
  },
  recentItemTitle: {
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  recentDeleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(220, 38, 38, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  recentDeleteText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  recentHeaderActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  recentDeleteSelectedButton: {
    backgroundColor: palette.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  recentDeleteSelectedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  recentItemSelected: {
    borderWidth: 2,
    borderColor: palette.primary,
  },
  recentItemCheckbox: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  recentItemCheckboxSelected: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  recentItemCheckboxText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recentEmpty: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentEmptyText: {
    color: palette.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});
