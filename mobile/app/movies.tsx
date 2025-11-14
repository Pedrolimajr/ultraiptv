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

interface Movie {
  id: string;
  title: string;
  poster?: string;
  stream_url: string;
  description?: string;
  year?: number;
}

export default function MoviesScreen() {
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    try {
      const token = await AsyncStorage.getItem('@ultraiptv_token');
      
      const response = await fetch(API_ENDPOINTS.MOVIES, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMovies(Array.isArray(data) ? data : data.movies || []);
      }
    } catch (error) {
      console.error('Erro ao carregar filmes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoviePress = (movie: Movie) => {
    router.push({
      pathname: '/player',
      params: {
        uri: movie.stream_url,
        title: movie.title,
        type: 'movie',
      },
    });
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D9FF" />
        <Text style={styles.loadingText}>Carregando filmes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FILMES</Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={movies}
        renderItem={renderMovie}
        keyExtractor={(item) => item.id}
        numColumns={4}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum filme disponível</Text>
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
  movieItem: {
    flex: 1,
    margin: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.2)',
  },
  moviePoster: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  moviePosterPlaceholder: {
    width: '100%',
    height: 250,
    backgroundColor: 'rgba(0, 217, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moviePosterText: {
    fontSize: 64,
  },
  movieTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    padding: 10,
    textAlign: 'center',
  },
  movieYear: {
    color: '#CCCCCC',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingBottom: 10,
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
});

