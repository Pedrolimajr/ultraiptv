import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Alert,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppLogo from '../src/components/AppLogo';
import { palette } from '../src/theme/palette';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS } from '../config/api';
import { useSettings } from '../src/context/SettingsContext';

interface Channel {
  id: string;
  name: string;
  logo?: string;
  stream_url: string;
  direct_url?: string;
}

const SLOT_KEYS = ['A', 'B'] as const;
type SlotKey = typeof SLOT_KEYS[number];

export default function MultiScreenScreen() {
  const router = useRouter();
  const { settings } = useSettings();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<SlotKey>('A');
  const [slots, setSlots] = useState<Record<SlotKey, Channel | null>>({
    A: null,
    B: null,
  });
  const videoRefs = {
    A: useRef<Video>(null),
    B: useRef<Video>(null),
  };

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      const token = await AsyncStorage.getItem('@ultraiptv_token');
      if (!token) throw new Error('Token não encontrado');
      const response = await fetch(API_ENDPOINTS.LIVE, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Erro ao carregar canais');
      }
      const data = await response.json();
      const list = Array.isArray(data) ? data : data.channels || [];
      setChannels(list);
    } catch (error: any) {
      console.error('[MULTI] erro', error);
      Alert.alert('Multi-screen', error.message || 'Não foi possível carregar os canais.');
    } finally {
      setLoading(false);
    }
  };

  const buildStreamUrl = (channel: Channel) => {
    if (settings.streamFormat === 'direct' && channel.direct_url) return channel.direct_url;
    return channel.stream_url;
  };

  const handleChannelSelect = (channel: Channel) => {
    setSlots((prev) => ({
      ...prev,
      [selectedSlot]: channel,
    }));
  };

  const handleClearSlot = (slot: SlotKey) => {
    setSlots((prev) => ({
      ...prev,
      [slot]: null,
    }));
    const ref = videoRefs[slot].current;
    ref?.unloadAsync();
  };

  const renderChannel = ({ item }: { item: Channel }) => (
    <TouchableOpacity
      style={styles.channelCard}
      onPress={() => handleChannelSelect(item)}
      activeOpacity={0.8}
    >
      {item.logo ? (
        <Image source={{ uri: item.logo }} style={styles.channelLogo} />
      ) : (
        <View style={styles.channelLogoPlaceholder}>
          <Text style={styles.channelLogoText}>{item.name.charAt(0)}</Text>
        </View>
      )}
      <Text style={styles.channelName} numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={palette.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <AppLogo size={80} />
          <Text style={styles.headerTitle}>Multi-screen</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.playersRow}>
        {SLOT_KEYS.map((slotKey) => {
          const channel = slots[slotKey];
          return (
            <View
              key={slotKey}
              style={[
                styles.playerCard,
                selectedSlot === slotKey && styles.playerCardActive,
              ]}
            >
              <View style={styles.playerCardHeader}>
                <Text style={styles.playerCardTitle}>Slot {slotKey}</Text>
                {channel && (
                  <TouchableOpacity onPress={() => handleClearSlot(slotKey)}>
                    <Text style={styles.clearSlotButton}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
              {channel ? (
                <>
                  <Video
                    ref={videoRefs[slotKey]}
                    style={styles.player}
                    source={{ uri: buildStreamUrl(channel) }}
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay
                    isLooping
                  />
                  <Text style={styles.playingLabel}>{channel.name}</Text>
                </>
              ) : (
                <View style={styles.playerPlaceholder}>
                  <Text style={styles.placeholderText}>
                    Escolha um canal para este slot
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.slotSelector}>
        {SLOT_KEYS.map((slotKey) => (
          <TouchableOpacity
            key={slotKey}
            style={[
              styles.slotButton,
              selectedSlot === slotKey && styles.slotButtonActive,
            ]}
            onPress={() => setSelectedSlot(slotKey)}
          >
            <Text
              style={[
                styles.slotButtonText,
                selectedSlot === slotKey && styles.slotButtonTextActive,
              ]}
            >
              Controlar slot {slotKey}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={styles.loadingText}>Carregando canais...</Text>
        </View>
      ) : (
        <FlatList
          data={channels}
          renderItem={renderChannel}
          keyExtractor={(item, index) => `${String(item.id || 'channel')}_${index}`}
          numColumns={3}
          columnWrapperStyle={styles.channelRow}
          contentContainerStyle={styles.channelList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum canal disponível</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const { width } = Dimensions.get('window');
const CHANNEL_CARD_WIDTH = (width - 48) / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    width: 44,
  },
  playersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 12,
  },
  playerCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: palette.surface,
    padding: 12,
  },
  playerCardActive: {
    borderColor: palette.primary,
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  playerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  playerCardTitle: {
    color: palette.textPrimary,
    fontWeight: '600',
  },
  clearSlotButton: {
    color: palette.textSecondary,
    fontSize: 16,
  },
  player: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    backgroundColor: '#000',
  },
  playerPlaceholder: {
    height: 160,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.backgroundAlt,
  },
  placeholderText: {
    color: palette.textSecondary,
    textAlign: 'center',
  },
  playingLabel: {
    marginTop: 10,
    color: palette.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  slotSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  slotButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  slotButtonActive: {
    borderColor: palette.primary,
    backgroundColor: 'rgba(0,224,255,0.08)',
  },
  slotButtonText: {
    color: palette.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  slotButtonTextActive: {
    color: palette.primary,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: palette.textSecondary,
    marginTop: 10,
  },
  channelList: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 10,
  },
  channelRow: {
    justifyContent: 'space-between',
  },
  channelCard: {
    width: CHANNEL_CARD_WIDTH,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: palette.surface,
    padding: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  channelLogo: {
    width: '100%',
    height: 80,
    borderRadius: 10,
    marginBottom: 8,
  },
  channelLogoPlaceholder: {
    width: '100%',
    height: 80,
    borderRadius: 10,
    backgroundColor: palette.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  channelLogoText: {
    color: palette.primary,
    fontSize: 32,
    fontWeight: '700',
  },
  channelName: {
    color: palette.textPrimary,
    fontSize: 12,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: palette.textSecondary,
  },
});

