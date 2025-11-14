import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { API_ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Channel {
  id: string;
  name: string;
  logo?: string;
  stream_url: string;
  category?: string;
}

export default function LiveScreen() {
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      const token = await AsyncStorage.getItem('@ultraiptv_token');
      
      const response = await fetch(API_ENDPOINTS.LIVE, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChannels(Array.isArray(data) ? data : data.channels || []);
        
        // Extrair categorias únicas
        const uniqueCategories = Array.from(
          new Set(data.map((ch: Channel) => ch.category).filter(Boolean))
        ) as string[];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Erro ao carregar canais:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChannelPress = (channel: Channel) => {
    router.push({
      pathname: '/player',
      params: {
        uri: channel.stream_url,
        title: channel.name,
        type: 'live',
      },
    });
  };

  const filteredChannels = selectedCategory === 'all'
    ? channels
    : channels.filter(ch => ch.category === selectedCategory);

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D9FF" />
        <Text style={styles.loadingText}>Carregando canais...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>LIVE TV</Text>
        <View style={styles.headerRight} />
      </View>

      {categories.length > 0 && (
        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === 'all' && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory('all')}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === 'all' && styles.categoryTextActive,
                ]}
              >
                Todos
              </Text>
            </TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category && styles.categoryTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={filteredChannels}
        renderItem={renderChannel}
        keyExtractor={(item) => item.id}
        numColumns={4}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum canal disponível</Text>
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
  categoriesContainer: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryButtonActive: {
    backgroundColor: '#00D9FF',
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  categoryTextActive: {
    color: '#000000',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 15,
  },
  channelItem: {
    flex: 1,
    margin: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.2)',
  },
  channelLogo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 10,
  },
  channelLogoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 217, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  channelLogoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00D9FF',
  },
  channelName: {
    color: '#FFFFFF',
    fontSize: 12,
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

