import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { API_ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Series {
  id: string;
  title: string;
  poster?: string;
  description?: string;
  seasons?: Season[];
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
  number: number;
}

export default function SeriesScreen() {
  const router = useRouter();
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);

  useEffect(() => {
    loadSeries();
  }, []);

  const loadSeries = async () => {
    try {
      const token = await AsyncStorage.getItem('@ultraiptv_token');
      
      const response = await fetch(API_ENDPOINTS.SERIES, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSeries(Array.isArray(data) ? data : data.series || []);
      }
    } catch (error) {
      console.error('Erro ao carregar séries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeriesPress = (serie: Series) => {
    setSelectedSeries(serie);
  };

  const handleEpisodePress = (episode: Episode) => {
    router.push({
      pathname: '/player',
      params: {
        uri: episode.stream_url,
        title: `${selectedSeries?.title} - Ep. ${episode.number}`,
        type: 'series',
      },
    });
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D9FF" />
        <Text style={styles.loadingText}>Carregando séries...</Text>
      </View>
    );
  }

  if (selectedSeries) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setSelectedSeries(null)}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedSeries.title}</Text>
          <View style={styles.headerRight} />
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
                  <Text style={styles.episodeText}>
                    Ep. {episode.number} - {episode.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          keyExtractor={(item) => item.id}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SÉRIES</Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={series}
        renderItem={renderSeries}
        keyExtractor={(item) => item.id}
        numColumns={4}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma série disponível</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#00D9FF',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerRight: {
    width: 80,
  },
  listContent: {
    padding: 15,
  },
  seriesItem: {
    flex: 1,
    margin: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.2)',
  },
  seriesPoster: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  seriesPosterPlaceholder: {
    width: '100%',
    height: 250,
    backgroundColor: 'rgba(0, 217, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seriesPosterText: {
    fontSize: 64,
  },
  seriesTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    padding: 10,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  seasonContainer: {
    padding: 15,
    marginBottom: 20,
  },
  seasonTitle: {
    color: '#00D9FF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  episodeItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.2)',
  },
  episodeText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});

