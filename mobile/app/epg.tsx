import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../config/api';
import { palette } from '../src/theme/palette';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../src/context/SettingsContext';
import AppLogo from '../src/components/AppLogo';

interface EpgItem {
  id: string;
  channel: string;
  title: string;
  description?: string;
  start: string;
  end: string;
}

const fallbackEpg: EpgItem[] = [
  {
    id: 'epg-1',
    channel: 'Ultra News HD',
    title: 'Jornal da Manhã',
    description: 'Principais notícias do dia com análises completas.',
    start: new Date().toISOString(),
    end: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'epg-2',
    channel: 'Sports Max 24/7',
    title: 'Arena Ultra',
    description: 'Bastidores e entrevistas exclusivas com atletas.',
    start: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    end: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'epg-3',
    channel: 'Music Vibes',
    title: 'Playlists ao Vivo',
    description: 'Os maiores hits eletrônicos da semana.',
    start: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    end: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
  },
];

export default function EpgScreen() {
  const router = useRouter();
  const { settings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<EpgItem[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('@ultraiptv_token');
        if (!token) {
          throw new Error('Token não encontrado');
        }
        const response = await fetch(API_ENDPOINTS.EPG, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Erro ao carregar EPG');
        }
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.epg || data.guide || [];
        if (!list.length) throw new Error('EPG vazio');
        setItems(list);
      } catch (error: any) {
        console.warn('[EPG] usando fallback', error);
        setItems(fallbackEpg);
        Alert.alert('EPG', error.message || 'Não foi possível carregar a grade completa. Exibindo exemplos.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formatHour = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, settings.timeFormat24h ? 'HH:mm' : 'hh:mm aa', { locale: ptBR });
  };

  const renderItem = ({ item }: { item: EpgItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.channel}>{item.channel}</Text>
        <Text style={styles.time}>
          {formatHour(item.start)} - {formatHour(item.end)}
        </Text>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      {item.description && (
        <Text style={styles.description}>{item.description}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={palette.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <AppLogo size={80} />
          <Text style={styles.headerTitle}>Guia de Programação</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={styles.loadingText}>Carregando grade...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
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
  backText: {
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
    fontSize: 18,
    fontWeight: '600',
    marginTop: 6,
  },
  headerRight: {
    width: 40,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: palette.textSecondary,
    marginTop: 12,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  channel: {
    color: palette.primary,
    fontWeight: '600',
  },
  time: {
    color: palette.textSecondary,
    fontSize: 12,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});


