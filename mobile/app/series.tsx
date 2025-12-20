import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  RefreshControl,
  Dimensions,
  ScrollView,
  TextInput,
  Linking,
  Pressable,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { API_ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppLogo from '../src/components/AppLogo';
import { palette } from '../src/theme/palette';
import { useSettings } from '../src/context/SettingsContext';
import { useIptvConfig } from '../src/context/IptvContext';
import { buildIptvHeaders } from '../src/utils/iptv';
import { Ionicons } from '@expo/vector-icons';

interface Series {
  id: string;
  title: string;
  poster?: string;
  description?: string;
  seasons?: Season[];
  category?: string;
  year?: number;
  genre?: string;
  director?: string;
  cast?: string;
}

interface Season {
  id: string;
  number: number;
  episodes: Episode[];
}

interface Episode {
  id: string;
  title: string;
  stream_url: string;
  direct_url?: string;
  number: number;
}

export default function SeriesScreen() {
  const router = useRouter();
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [catOffset, setCatOffset] = useState(0);
  const [recentSeries, setRecentSeries] = useState<Series[]>([]);
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
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [catQuery, setCatQuery] = useState('');

  const loadRecentSeries = useCallback(async () => {
    try {
      console.log('[SERIES] Carregando assistidos recentes...');
      const raw = await AsyncStorage.getItem('@ultraiptv_recent_watched_series');
      console.log('[SERIES] Dados brutos do storage:', raw ? 'encontrado' : 'não encontrado');
      
      if (raw) {
        const items = JSON.parse(raw);
        console.log('[SERIES] Itens parseados:', items.length);
        
        if (Array.isArray(items) && items.length > 0) {
          // Filtrar apenas itens do tipo 'series' para evitar que filmes apareçam aqui
          const seriesItems = items.filter((item: any) => {
            const itemType = item.type || '';
            return itemType === 'series' || itemType === 'series';
          });
          
          const sorted = seriesItems.sort((a: any, b: any) => (b.lastWatched || 0) - (a.lastWatched || 0));
          // Manter os dados completos incluindo position para retomar de onde parou
          const seriesList: any[] = sorted.slice(0, 20).map((item: any) => ({
            id: item.sid || item.id || String(Math.random()),
            title: item.title || 'Sem título',
            poster: item.poster || item.logo || item.poster_url || '',
            category: item.category || '',
            year: undefined,
            description: undefined,
            seasons: undefined,
            genre: undefined,
            director: undefined,
            cast: undefined,
            position: item.position || 0, // Manter posição salva
            duration: item.duration || 0, // Manter duração salva
            seriesId: item.sid || item.id, // ID da série para buscar progresso
          }));
          console.log('[SERIES] Assistidos recentes processados:', seriesList.length, 'de', items.length, 'itens totais (filtrados apenas séries)');
          setRecentSeries(seriesList);
        } else {
          console.log('[SERIES] Lista vazia ou inválida');
          setRecentSeries([]);
        }
      } else {
        console.log('[SERIES] Nenhum dado encontrado no storage');
        setRecentSeries([]);
      }
    } catch (error) {
      console.error('[SERIES] Erro ao carregar séries recentes:', error);
      setRecentSeries([]);
    }
  }, []);

  const handleDeleteRecent = async (seriesId: string) => {
    console.log('[DELETE] handleDeleteRecent chamado com ID:', seriesId, 'isSelectMode:', isSelectMode);
    
    if (isSelectMode) {
      // Modo seleção - adicionar/remover da seleção
      const newSelected = new Set(selectedRecentIds);
      if (newSelected.has(seriesId)) {
        newSelected.delete(seriesId);
      } else {
        newSelected.add(seriesId);
      }
      setSelectedRecentIds(newSelected);
      return;
    }

    // Executar exclusão diretamente
    try {
      const raw = await AsyncStorage.getItem('@ultraiptv_recent_watched_series');
      if (!raw) {
        Alert.alert('Aviso', 'Nenhuma série encontrada para remover.');
        return;
      }
      
      const items = JSON.parse(raw);
      if (!Array.isArray(items) || items.length === 0) {
        Alert.alert('Aviso', 'Nenhuma série encontrada para remover.');
        return;
      }
      
      console.log('[DELETE] ===== INÍCIO DA EXCLUSÃO (SÉRIE) =====');
      console.log('[DELETE] ID recebido:', seriesId, 'Tipo:', typeof seriesId);
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
      const targetId = String(seriesId || '').trim();
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
          itemSidRaw === seriesId ||
          itemIdRaw === seriesId ||
          String(itemSidRaw) === String(seriesId) ||
          String(itemIdRaw) === String(seriesId) ||
          itemSid === String(seriesId) ||
          itemId === String(seriesId)
        ) {
          foundIndex = i;
          foundItem = item;
          console.log('[DELETE] ✅ Item encontrado no índice', i, ':', {
            title: item.title,
            sid: item.sid,
            id: item.id,
            targetId,
            seriesId,
          });
          break;
        }
      }
      
      if (foundIndex === -1) {
        console.log('[DELETE] ❌ Item NÃO encontrado. Tentando busca mais ampla...');
        // Tentar buscar pelo índice na lista de recentSeries
        const seriesIndex = recentSeries.findIndex(s => String(s.id) === String(seriesId));
        if (seriesIndex >= 0) {
          const series = recentSeries[seriesIndex];
          console.log('[DELETE] Série encontrada na lista local:', series);
          // Tentar encontrar no storage usando o título
          const foundByTitle = items.findIndex((i: any) => 
            String(i.title || '').trim() === String(series.title || '').trim()
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
          'Série não encontrada',
          `Não foi possível encontrar a série na lista.\n\nID procurado: ${seriesId}\n\nTotal de itens: ${items.length}`
        );
        return;
      }
      
      // Remover o item encontrado
      const filtered = items.filter((_: any, index: number) => index !== foundIndex);
      console.log('[DELETE] Itens depois da remoção:', filtered.length);
      
      await AsyncStorage.setItem('@ultraiptv_recent_watched_series', JSON.stringify(filtered));
      
      // Remover progresso - tentar com diferentes formatos de ID
      try {
        const progressKeys = [
          `@ultraiptv_progress_series_${seriesId}`,
          `@ultraiptv_progress_series_${targetId}`,
          `@ultraiptv_progress_series_${foundItem.sid}`,
          `@ultraiptv_progress_series_${foundItem.id}`,
        ];
        for (const key of progressKeys) {
          await AsyncStorage.removeItem(key);
        }
        console.log('[DELETE] Progresso removido');
      } catch (e) {
        console.warn('[DELETE] Erro ao remover progresso:', e);
      }
      
      // Recarregar lista
      await loadRecentSeries();
      console.log('[DELETE] ===== EXCLUSÃO CONCLUÍDA (SÉRIE) =====');
      Alert.alert('Sucesso', 'Série removida dos assistidos recentes.');
    } catch (error: any) {
      console.error('[DELETE] Erro ao remover série:', error);
      Alert.alert('Erro', `Não foi possível remover a série: ${error?.message || error}`);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRecentIds.size === 0) {
      Alert.alert('Aviso', 'Selecione pelo menos uma série para remover.');
      return;
    }

    const count = selectedRecentIds.size;
    Alert.alert(
      'Remover séries',
      `Deseja remover ${count} série(s) dos assistidos recentes?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              const raw = await AsyncStorage.getItem('@ultraiptv_recent_watched_series');
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
                
                await AsyncStorage.setItem('@ultraiptv_recent_watched_series', JSON.stringify(filtered));
                
                // Remover progressos dos selecionados
                for (const selectedId of selectedRecentIds) {
                  try {
                    const progressKey1 = `@ultraiptv_progress_series_${selectedId}`;
                    const progressKey2 = `@ultraiptv_progress_series_${String(selectedId).trim()}`;
                    await AsyncStorage.removeItem(progressKey1);
                    await AsyncStorage.removeItem(progressKey2);
                  } catch (e) {
                    console.warn('Erro ao remover progresso:', e);
                  }
                }
                
                setSelectedRecentIds(new Set());
                setIsSelectMode(false);
                await loadRecentSeries();
                Alert.alert('Sucesso', `${count} série(s) removida(s) dos assistidos recentes.`);
              }
            } catch (error: any) {
              console.error('Erro ao remover séries:', error);
              Alert.alert('Erro', `Não foi possível remover as séries: ${error?.message || error}`);
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
          const key = `@ultraiptv_series_cache:${activeId || 'default'}:${selectedCategory}`;
          const raw = await AsyncStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            // Verifica se o cache tem menos de 5 minutos
            const cacheAge = Date.now() - (parsed.ts || 0);
            const isCacheValid = cacheAge < 5 * 60 * 1000; // 5 minutos
            if (Array.isArray(parsed?.items) && parsed.items.length > 0 && isCacheValid) {
              setSeries(parsed.items);
              if (Array.isArray(parsed.categories)) setCategories(parsed.categories);
              setLoading(false);
              // Carrega atualizações em background
              loadSeries(1, true);
              return;
            }
          }
        } catch {}
        setSeries([]);
        setPage(1);
        setHasMore(true);
        await loadSeries(1, true);
      })();
    } else {
      setLoading(false);
    }
  }, [selectedCategory, iptvConfig, activeId]);

  const filterSeries = (list: Series[]) => {
    if (!settings.parentalControlEnabled) return list;
    return list.filter((item) => {
      const target = `${item.title} ${item.description || ''}`.toLowerCase();
      return !settings.blockedKeywords.some((keyword) =>
        target.includes(keyword.toLowerCase())
      );
    });
  };

  const loadSeries = useCallback(async (nextPage: number = 1, reset: boolean = false) => {
    if (!iptvConfig) {
      Alert.alert('Playlist necessária', 'Configure sua playlist IPTV para listar as séries.');
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
      const response = await fetch(`${API_ENDPOINTS.SERIES}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...buildIptvHeaders(iptvConfig),
        },
      });
      
      console.log('[SERIES] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.series || [];
        const safeList = filterSeries(list);
        setSeries((prev) => {
          const merged = reset ? safeList : [...prev, ...safeList];
          const serverCategories = Array.isArray((data as any).categories) ? (data as any).categories : [];
          // Filtra categorias vazias e duplicadas, mantém apenas plataformas
          const uniqueCategories = Array.from(new Set((merged as Series[]).map((s: Series) => s.category).filter(Boolean))) as string[];
          const cats = serverCategories.length > 0
            ? serverCategories.filter((c: string) => c && c.trim() !== '')
            : uniqueCategories;
          setCategories(cats);
          try {
            const key = `@ultraiptv_series_cache:${activeId || 'default'}:${selectedCategory}`;
            AsyncStorage.setItem(key, JSON.stringify({ items: merged, categories: cats, ts: Date.now() }));
          } catch {}
          return merged;
        });
        setPage(nextPage);
        setHasMore(Boolean(data.hasMore));
        // Removido carregamento automático da página 2 para melhorar performance
        if (safeList.length === 0) {
          Alert.alert('Aviso', 'Nenhuma série disponível no momento.');
        }
      } else {
        const errorText = await response.text();
        console.error('Erro ao carregar séries:', response.status, errorText);
        Alert.alert('Erro', `Não foi possível carregar séries. Status: ${response.status}`);
      }
    } catch (error: any) {
      console.error('Erro ao carregar séries:', error);
      Alert.alert('Erro', `Erro ao conectar com a API: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [iptvConfig, selectedCategory, settings.parentalControlEnabled, settings.blockedKeywords, activeId, router]);

  const handleSeriesPress = async (serie: any) => {
    if (!iptvConfig) {
      Alert.alert('Playlist necessária', 'Configure sua playlist IPTV no dashboard.');
      return;
    }

    if (!serie || !serie.id) {
      Alert.alert('Erro', 'Série inválida. Tente novamente.');
      return;
    }

    // Se a série tem position (vindo de Assistidos Recentes), buscar o último episódio assistido
    if (serie.position && serie.position > 0 && serie.seriesId) {
      console.log('[SERIES] Série com progresso salvo encontrada, buscando último episódio...');
      // Buscar progresso da série para encontrar o último episódio assistido
      try {
        const progressKey = `@ultraiptv_progress_series_${serie.seriesId}`;
        const progressRaw = await AsyncStorage.getItem(progressKey);
        if (progressRaw) {
          const progress = JSON.parse(progressRaw);
          console.log('[SERIES] Progresso encontrado:', progress);
          // Continuar para carregar detalhes e depois reproduzir o episódio
        }
      } catch (error) {
        console.warn('[SERIES] Erro ao buscar progresso:', error);
      }
    }

    setSelectedSeries({ ...serie, seasons: [] });

    try {
      setDetailLoading(true);
      const token = await AsyncStorage.getItem('@ultraiptv_token');
      if (!token) {
        Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
        router.replace('/login');
        return;
      }

      console.log('[SERIES] Buscando detalhes da série ID:', serie.id);
      const seriesId = String(serie.id).trim();
      const response = await fetch(API_ENDPOINTS.SERIES_DETAIL(seriesId), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...buildIptvHeaders(iptvConfig),
        },
      });

      console.log('[SERIES] Response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Falha ao carregar detalhes da série';
        try {
          const errorText = await response.text();
          if (errorText) {
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.message || errorJson.error || errorText;
            } catch {
              errorMessage = errorText;
            }
          }
        } catch (e) {
          console.warn('Erro ao ler mensagem de erro:', e);
        }
        throw new Error(errorMessage);
      }

      const detail = await response.json();
      console.log('[SERIES] Detalhes carregados:', detail?.title, 'Temporadas:', detail?.seasons?.length || 0);
      
      if (!detail || !detail.seasons || detail.seasons.length === 0) {
        Alert.alert('Aviso', 'Esta série não possui episódios disponíveis.');
        setSelectedSeries(null);
        return;
      }
      
      setSelectedSeries(detail);
    } catch (error: any) {
      console.error('[SERIES] Erro ao carregar detalhes:', error);
      const errorMessage = error?.message || error?.toString() || 'Não foi possível carregar os episódios.';
      Alert.alert('Erro', errorMessage);
      setSelectedSeries(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleEpisodePress = async (episode: Episode) => {
    const playbackUrl = settings.streamFormat === 'direct' && episode.direct_url ? episode.direct_url : episode.stream_url;
    if (!playbackUrl) {
      Alert.alert('Erro', 'Este episódio não possui URL de stream disponível.');
      return;
    }
    const title = `${selectedSeries?.title} - Ep. ${episode.number}`;
    let ext = (playbackUrl.split('.').pop() || '').split('?')[0];
    ext = (!ext || ext.toLowerCase() === 'null' || ext.toLowerCase() === 'undefined' || /[^a-z0-9]/i.test(ext) || ext.length > 4) ? 'mp4' : ext.toLowerCase();
    
    // Buscar progresso salvo se existir
    let savedProgress = null;
    try {
      const progressKey = `@ultraiptv_progress_series_${episode.id}`;
      const progressRaw = await AsyncStorage.getItem(progressKey);
      if (progressRaw) {
        const progress = JSON.parse(progressRaw);
        if (progress.position && progress.duration) {
          const percentage = (progress.position / progress.duration) * 100;
          if (percentage < 90) {
            savedProgress = progress.position;
          }
        }
      }
    } catch {}
    
    if (!selectedSeries) {
      Alert.alert('Erro', 'Série não selecionada. Tente novamente.');
      return;
    }
    
    const playbackData: any = { 
      uri: playbackUrl, 
      title, 
      type: 'series', 
      sid: episode.id, 
      seriesId: selectedSeries.id, // ID da série, não do episódio
      ext,
      poster: selectedSeries.poster || '',
      category: selectedSeries.category || '',
      from: 'series',
    };
    
    if (savedProgress) {
      playbackData.savedPosition = savedProgress;
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
      if (selectedSeries?.seasons) {
        const items = [...(selectedSeries.seasons || [])]
          .sort((a, b) => a.number - b.number)
          .flatMap((season) => season.episodes.map((ep) => {
            const u = settings.streamFormat === 'direct' && ep.direct_url ? ep.direct_url : ep.stream_url;
            let e = (u.split('.').pop() || '').split('?')[0];
            e = (!e || e.toLowerCase() === 'null' || e.toLowerCase() === 'undefined' || /[^a-z0-9]/i.test(e) || e.length > 4) ? 'mp4' : e.toLowerCase();
            const t = `${selectedSeries?.title} - T${season.number} Ep. ${ep.number}`;
            return { uri: u, title: t, sid: ep.id, ext: e };
          }));
        const index = items.findIndex((it) => String(it.sid) === String(episode.id));
        const store = { items, index: index >= 0 ? index : 0 };
        // Salva em ambos os lugares (web e mobile)
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem('ultraiptv_series_playlist', JSON.stringify(store));
        }
        await AsyncStorage.setItem('@ultraiptv_series_playlist', JSON.stringify(store));
      }
    } catch (error) {
      console.error('Erro ao salvar playlist de séries:', error);
    }
    // Construir URL com savedPosition se existir
    const seriesId = String(selectedSeries.id || '').trim();
    let url = `/player?uri=${encodeURIComponent(playbackUrl)}&title=${encodeURIComponent(title)}&type=series&sid=${encodeURIComponent(episode.id)}&seriesId=${encodeURIComponent(seriesId)}&ext=${encodeURIComponent(ext)}&from=series&poster=${encodeURIComponent(selectedSeries.poster || '')}&category=${encodeURIComponent(selectedSeries.category || '')}`;
    if (selectedSeries?.poster) {
      url += `&poster=${encodeURIComponent(selectedSeries.poster)}`;
    }
    if (selectedSeries?.category) {
      url += `&category=${encodeURIComponent(selectedSeries.category)}`;
    }
    if (savedProgress) {
      url += `&savedPosition=${savedProgress}`;
    }
    router.push(url);
  };

  const renderSeries = ({ item }: { item: Series }) => (
    <TouchableOpacity
      style={styles.seriesItem}
      onPress={() => handleSeriesPress(item)}
      activeOpacity={0.7}
    >
      {item.poster ? (
        <Image source={{ uri: item.poster }} style={styles.seriesPoster} />
      ) : (
        <View style={styles.seriesPosterPlaceholder}>
          <Text style={styles.seriesPosterText}>🎭</Text>
        </View>
      )}
      <Text style={styles.seriesTitle} numberOfLines={2}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  useEffect(() => {
    const onKey = (e: any) => {
      if (selectedSeries) {
        if (e.key === 'Escape' || e.key === 'Backspace') {
          setSelectedSeries(null);
        }
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [selectedSeries]);

  useEffect(() => {
    const BackHandler = require('react-native').BackHandler;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectedSeries) {
        setSelectedSeries(null);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [selectedSeries]);

  if (iptvLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={styles.loadingText}>Carregando séries...</Text>
      </View>
    );
  }

  if (!iptvConfig) {
    return (
      <View style={styles.loadingContainer}>
        <AppLogo size={110} />
        <Text style={[styles.loadingText, { marginTop: 20 }]}>
          Para acessar as séries, adicione sua playlist IPTV no dashboard.
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

  if (selectedSeries) {
    const handlePlayFirst = () => {
      const firstSeason = (selectedSeries.seasons || []).sort((a, b) => a.number - b.number)[0];
      const firstEp = firstSeason?.episodes?.[0];
      if (firstEp) handleEpisodePress(firstEp);
    };
    const handleAddFavorite = async () => {
      try {
        const raw = await AsyncStorage.getItem('@ultraiptv_favorites_series');
        const list = raw ? JSON.parse(raw) : [];
        const exists = list.some((s: any) => String(s.id) === String(selectedSeries?.id));
        const next = exists ? list : [{ id: selectedSeries?.id, title: selectedSeries?.title, poster: selectedSeries?.poster }, ...list];
        await AsyncStorage.setItem('@ultraiptv_favorites_series', JSON.stringify(next));
        Alert.alert('Favoritos', 'Adicionado aos favoritos.');
      } catch (e: any) {
        Alert.alert('Erro', e?.message || 'Não foi possível adicionar aos favoritos.');
      }
    };
    const handleOpenTrailer = async () => {
      const q = encodeURIComponent(`${selectedSeries?.title} trailer oficial`);
      const url = `https://www.youtube.com/results?search_query=${q}`;
      try { await Linking.openURL(url); } catch {}
    };

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setSelectedSeries(null)}>
            <Ionicons name="arrow-back" size={28} color={palette.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <AppLogo size={72} />
            <Text style={styles.headerTitle}>{selectedSeries.title}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerBadge}>{selectedSeries.seasons?.length || 0} temp.</Text>
          </View>
        </View>

        {detailLoading && (
          <View style={styles.detailOverlay}>
            <ActivityIndicator size="large" color={palette.primary} />
          </View>
        )}

        <View style={styles.detailContainer}>
          {selectedSeries.poster ? (
            <Image source={{ uri: selectedSeries.poster }} style={styles.detailPoster} />
          ) : (
            <View style={styles.detailPosterPlaceholder}>
              <Text style={styles.seriesPosterText}>🎭</Text>
            </View>
          )}
          <View style={styles.detailInfo}>
            <Text style={styles.detailTitle}>{selectedSeries.title}</Text>
            <Text style={styles.detailMeta}>
              {selectedSeries.genre ? `Gênero: ${selectedSeries.genre}` : ''}
              {selectedSeries.year ? (selectedSeries.genre ? ' • ' : '') + `Ano: ${selectedSeries.year}` : ''}
            </Text>
            {selectedSeries.director && (
              <Text style={styles.detailMeta}>Diretor: {selectedSeries.director}</Text>
            )}
            {selectedSeries.cast && (
              <Text style={styles.detailMeta}>Atores: {selectedSeries.cast}</Text>
            )}
            {selectedSeries.description && (
              <Text style={styles.detailDescription} numberOfLines={6}>{selectedSeries.description}</Text>
            )}

            <View style={styles.detailActions}>
              <TouchableOpacity style={[styles.actionPrimary, { backgroundColor: '#d60000' }]} onPress={handlePlayFirst}>
                <Text style={styles.actionPrimaryText}>ASSISTIR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionSecondary, { backgroundColor: '#f0c400' }]} onPress={handleAddFavorite}>
                <Text style={styles.actionSecondaryText}>ADICIONAR AOS FAVORITOS</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionSecondary, { backgroundColor: '#0066cc' }]} onPress={handleOpenTrailer}>
                <Text style={styles.actionSecondaryText}>TRAILER</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <FlatList
          data={selectedSeries.seasons || []}
          renderItem={({ item: season }) => (
            <View style={styles.seasonContainer}>
              <Text style={styles.seasonTitle}>Temporada {season.number}</Text>
              {season.episodes.map((episode) => (
                <TouchableOpacity
                  key={episode.id}
                  style={styles.episodeItem}
                  onPress={() => handleEpisodePress(episode)}
                >
                  <Text style={styles.episodeText}>Ep. {episode.number} - {episode.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          keyExtractor={(item, index) => `${String(item.id || 'season')}_${index}`}
        />
      </View>
    );
  }

  // moved above to keep hooks order consistent across renders

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <AppLogo size={80} />
          <Text style={styles.headerTitle}>Séries</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerBadge}>
            {series.length} títulos
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
          placeholder="Pesquisar séries"
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
          {showRecent && (
            recentSeries.length > 0 ? (
              <FlatList
                horizontal
                data={recentSeries}
                keyExtractor={(item) => `recent_${item.id}`}
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
                            handleSeriesPress(item);
                          }
                        }}
                        activeOpacity={0.7}
                        disabled={false}
                      >
                        {item.poster ? (
                          <Image source={{ uri: item.poster }} style={styles.recentItemImage} />
                        ) : (
                          <View style={styles.recentItemPlaceholder}>
                            <Text style={styles.recentItemPlaceholderText}>🎭</Text>
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
                        <TouchableOpacity
                          style={styles.recentDeleteButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            console.log('[DELETE] Botão de exclusão pressionado para série ID:', item.id, 'Index:', index);
                            handleDeleteRecent(item.id);
                          }}
                          onPressIn={(e) => {
                            e.stopPropagation();
                          }}
                          activeOpacity={0.9}
                          hitSlop={{ top: 30, bottom: 30, left: 30, right: 30 }}
                        >
                          <Text style={styles.recentDeleteText}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                }}
                contentContainerStyle={styles.recentList}
                showsHorizontalScrollIndicator={false}
              />
            ) : (
              <View style={styles.recentEmpty}>
                <Text style={styles.recentEmptyText}>Nenhuma série assistida recentemente</Text>
              </View>
            )
          )}
        </View>

      <FlatList
            key={numColumns}
            data={series
          .filter((s) => selectedCategory === 'all' ? true : s.category === selectedCategory)
          .filter((s) => searchQuery ? (s.title || '').toLowerCase().includes(searchQuery.toLowerCase()) : true)
        }
        renderItem={renderSeries}
            keyExtractor={(item, index) => `${String(item.id || 'series')}_${index}`}
        numColumns={numColumns}
        initialNumToRender={24}
        maxToRenderPerBatch={24}
        windowSize={8}
        removeClippedSubviews
        contentContainerStyle={styles.listContent}
        onEndReached={() => {
          if (hasMore && !refreshing) {
            loadSeries(page + 1);
          }
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadSeries}
            tintColor={palette.primary}
            colors={[palette.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma série disponível</Text>
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
                  onPress={() => { setSelectedCategory(c); setShowCatPicker(false); setCatQuery(''); }}
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
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center',
  },
  headerRight: {
    minWidth: 90,
    alignItems: 'flex-end',
  },
  headerBadge: {
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    color: palette.textSecondary,
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
  seriesItem: {
    flex: 1,
    margin: 6,
    backgroundColor: palette.surface,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  seriesPoster: {
    width: '100%',
    height: 240,
    resizeMode: 'cover',
  },
  seriesPosterPlaceholder: {
    width: '100%',
    height: 240,
    backgroundColor: palette.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seriesPosterText: {
    fontSize: 48,
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
  seriesTitle: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    padding: 10,
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
  
  seasonContainer: {
    padding: 16,
    marginBottom: 20,
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  seasonTitle: {
    color: palette.primary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  episodeItem: {
    backgroundColor: palette.backgroundAlt,
    padding: 15,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  episodeText: {
    color: palette.textPrimary,
    fontSize: 14,
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
  detailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 10,
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
