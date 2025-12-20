import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  Dimensions,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { API_ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCachedChannels, cacheChannels, clearCachedChannels } from '../src/utils/cache';
import { pingWatchdog } from '../src/utils/watchdog';
import { useSettings } from '../src/context/SettingsContext';
import { palette } from '../src/theme/palette';
import AppLogo from '../src/components/AppLogo';
import { useIptvConfig } from '../src/context/IptvContext';
import { buildIptvHeaders } from '../src/utils/iptv';
import { Ionicons } from '@expo/vector-icons';

interface Channel {
  id: string;
  name: string;
  logo?: string;
  stream_url: string;
  direct_url?: string;
  category?: string;
}

export default function LiveScreen() {
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [catOffset, setCatOffset] = useState(0);
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [catQuery, setCatQuery] = useState('');
  const { settings } = useSettings();
  const { config: iptvConfig, loading: iptvLoading } = useIptvConfig();

  // Dynamic numColumns for TV responsiveness
  const [numColumns, setNumColumns] = useState(Math.max(2, Math.floor(Dimensions.get('window').width / 180)));
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setNumColumns(Math.max(2, Math.floor(window.width / 180)));
    });
    return () => { (sub as any)?.remove?.(); };
  }, []);

  useEffect(() => {
    if (iptvConfig) {
      loadChannels();
    } else {
      setLoading(false);
    }
  }, [iptvConfig]);

  useFocusEffect(
    useCallback(() => {
      if (settings.autoRefreshContent && iptvConfig) {
        loadChannels({ skipCache: true });
      }
    }, [settings.autoRefreshContent, iptvConfig])
  );

  const applyParentalFilter = (list: Channel[]) => {
    if (!settings.parentalControlEnabled) return list;
    return list.filter((item) => {
      const bucket = `${item.category || ''} ${item.name}`.toLowerCase();
      return !settings.blockedKeywords.some((keyword) =>
        bucket.includes(keyword.toLowerCase())
      );
    });
  };

  const loadChannels = async ({ skipCache = false }: { skipCache?: boolean } = {}) => {
    if (!iptvConfig) {
      Alert.alert('Playlist necessária', 'Configure sua playlist IPTV no dashboard para carregar os canais.');
      return;
    }
    try {
      let cached: Channel[] | null = null;
      if (settings.autoCleanCache) {
        await clearCachedChannels();
      } else if (!skipCache) {
        cached = await getCachedChannels();
        if (cached && cached.length > 0) {
          setChannels(cached);
          const uniqueCategories = Array.from(new Set(cached.map((ch: Channel) => ch.category).filter(Boolean))) as string[];
          setCategories(uniqueCategories);
          setLoading(false);
        }
      }

      const token = await AsyncStorage.getItem('@ultraiptv_token');
      
      if (!token) {
        Alert.alert('Erro', 'Token de autenticação não encontrado. Faça login novamente.');
        router.replace('/login');
        return;
      }
      
      setRefreshing(true);

      const response = await fetch(API_ENDPOINTS.LIVE, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...buildIptvHeaders(iptvConfig),
        },
      });
      
      console.log('[LIVE] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[LIVE] Dados recebidos:', {
          isArray: Array.isArray(data),
          hasChannels: !!data.channels,
          channelsCount: data.channels?.length || 0,
          source: data.source,
        });
        
        const list = Array.isArray(data) ? data : data.channels || [];
        console.log('[LIVE] Lista extraída:', list.length, 'canais');
        
        const safeList = applyParentalFilter(list);
        console.log('[LIVE] Após filtro:', safeList.length, 'canais');
        
        if (safeList.length > 0) {
          setChannels(safeList);
          await cacheChannels(safeList);
          const serverCategories = Array.isArray((data as any).categories) ? (data as any).categories : [];
          const uniqueCategories = serverCategories.length > 0
            ? serverCategories
            : Array.from(new Set(safeList.map((ch: Channel) => ch.category).filter(Boolean))) as string[];
          setCategories(uniqueCategories);
          console.log('[LIVE] ✅ Canais carregados com sucesso:', safeList.length);
        } else {
          console.warn('[LIVE] Lista vazia após filtro');
          if (list.length > 0) {
            Alert.alert(
              'Aviso',
              `Nenhum canal disponível após filtro de controle dos pais.\n\nTotal de canais: ${list.length}\nFiltrados: ${safeList.length}\n\nDesative o controle dos pais nas configurações para ver todos os canais.`
            );
          } else if (!cached || cached.length === 0) {
            Alert.alert(
              'Aviso',
              'Nenhum canal disponível.\n\nVerifique:\n• Se a playlist M3U está acessível\n• Se a URL está correta\n• Se há canais na playlist'
            );
          }
        }
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          const errorText = await response.text();
          errorData = { message: errorText };
        }
        console.error('Erro ao carregar canais:', response.status, errorData);
        // Se não tiver cache, mostra erro
        if (!cached || cached.length === 0) {
          Alert.alert(
            'Erro ao carregar canais',
            errorData.error || errorData.message || `Status: ${response.status}\n\nVerifique se a URL da playlist está correta e acessível.`
          );
        }
      }
    } catch (error: any) {
      console.error('Erro ao carregar canais:', error);
      const cached = await getCachedChannels();
      if (!cached || cached.length === 0) {
        Alert.alert('Erro', `Erro ao conectar com a API: ${error.message || 'Erro desconhecido'}`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleChannelPress = (channel: Channel) => {
    pingWatchdog();
    const playbackUrl = settings.streamFormat === 'direct' && channel.direct_url
      ? channel.direct_url
      : channel.stream_url;
    const url = `/player?uri=${encodeURIComponent(playbackUrl)}&title=${encodeURIComponent(channel.name)}&type=live&from=live`;
    router.push(url);
  };

  const filteredChannels = (selectedCategory === 'all'
    ? channels
    : channels.filter(ch => ch.category === selectedCategory))
    .filter(ch => searchQuery ? ch.name.toLowerCase().includes(searchQuery.toLowerCase()) : true)
    .filter(ch => {
      if (!settings.parentalControlEnabled) return true;
      const target = `${ch.name} ${ch.category || ''}`.toLowerCase();
      return !settings.blockedKeywords.some((kw) => target.includes(kw.toLowerCase()));
    });

  const renderChannel = ({ item }: { item: Channel }) => (
    <TouchableOpacity
      style={styles.channelItem}
      onPress={() => handleChannelPress(item)}
      activeOpacity={0.7}
    >
      {item.logo ? (
        <Image source={{ uri: item.logo }} style={styles.channelLogo} />
      ) : (
        <View style={styles.channelLogoPlaceholder}>
          <Text style={styles.channelLogoText}>{item.name.charAt(0)}</Text>
        </View>
      )}
      <Text style={styles.channelName} numberOfLines={2}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  if (iptvLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={styles.loadingText}>Carregando canais...</Text>
      </View>
    );
  }

  if (!iptvConfig) {
    return (
      <View style={styles.loadingContainer}>
        <AppLogo size={100} />
        <Text style={[styles.loadingText, { marginTop: 20 }]}>
          Configure sua playlist IPTV para liberar os canais.
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { marginTop: 24, width: 220 }]}
          onPress={() => router.push('/dashboard')}
        >
          <Text style={styles.backButtonText}>Abrir Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <AppLogo size={80} />
          <Text style={styles.headerTitle}>TV ao vivo</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.openPickerButton} onPress={() => setShowCatPicker(true)}>
            <Text style={styles.openPickerText}>Categorias</Text>
          </TouchableOpacity>
        </View>
      </View>

      {categories.length > 0 && (
        <View style={styles.categoriesContainer}>
          <View style={styles.categoryBar}>
            <TouchableOpacity
              style={[styles.categoryArrow, catOffset <= 0 && styles.categoryArrowDisabled]}
              onPress={() => setCatOffset(Math.max(0, catOffset - Math.max(4, Math.floor(Dimensions.get('window').width / 180))))}
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
            {categories.slice(catOffset, catOffset + Math.max(4, Math.floor(Dimensions.get('window').width / 180))).map((category) => (
              <TouchableOpacity
                key={category}
                style={[styles.categoryButton, selectedCategory === category && styles.categoryButtonActive]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[styles.categoryText, selectedCategory === category && styles.categoryTextActive]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.categoryArrow, (catOffset + Math.max(4, Math.floor(Dimensions.get('window').width / 180)) >= categories.length) && styles.categoryArrowDisabled]}
              onPress={() => setCatOffset(Math.min(Math.max(0, categories.length - Math.max(4, Math.floor(Dimensions.get('window').width / 180))), catOffset + Math.max(4, Math.floor(Dimensions.get('window').width / 180))))}
              disabled={catOffset + Math.max(4, Math.floor(Dimensions.get('window').width / 180)) >= categories.length}
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
          placeholder="Pesquisar canais"
          placeholderTextColor={palette.textSecondary}
          style={styles.searchInput}
        />
      </View>

      <FlatList
        key={numColumns}
        data={filteredChannels}
        renderItem={renderChannel}
        keyExtractor={(item, index) => `${String(item.id || 'channel')}_${index}`}
        numColumns={numColumns}
        initialNumToRender={28}
        maxToRenderPerBatch={28}
        windowSize={10}
        removeClippedSubviews
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadChannels({ skipCache: true })}
            tintColor={palette.primary}
            colors={[palette.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum canal disponível</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
    marginTop: 6,
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
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
  categoriesContainer: {
    paddingVertical: 12,
    paddingHorizontal: 10,
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
  listContent: {
    padding: 16,
    paddingBottom: 60,
  },
  channelItem: {
    flex: 1,
    margin: 6,
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  channelLogo: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginBottom: 10,
  },
  channelLogoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: palette.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  channelLogoText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: palette.primary,
  },
  channelName: {
    color: palette.textPrimary,
    fontSize: 14,
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
});
