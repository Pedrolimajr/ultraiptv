import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const { width, height } = Dimensions.get('window');

export default function DashboardScreen() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    loadUser();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('@ultraiptv_user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('@ultraiptv_token');
    await AsyncStorage.removeItem('@ultraiptv_user');
    router.replace('/login');
  };

  const MenuTile = ({ 
    title, 
    icon, 
    colors, 
    onPress, 
    large = false 
  }: {
    title: string;
    icon: string;
    colors: string[];
    onPress: () => void;
    large?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.tile, large && styles.largeTile]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={colors}
        style={styles.tileGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.tileIcon}>{icon}</Text>
        <Text style={styles.tileText}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logoText}>ULTRAIPTV</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.timeText}>
            {format(currentTime, 'HH:mm', { locale: ptBR })}
          </Text>
          <Text style={styles.dateText}>
            {format(currentTime, "dd 'de' MMMM, yyyy", { locale: ptBR })}
          </Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.grid}>
          {/* LIVE TV - Large Tile */}
          <MenuTile
            title="LIVE TV"
            icon="📺"
            colors={['#00D9FF', '#0066CC']}
            onPress={() => router.push('/live')}
            large
          />

          {/* MOVIES */}
          <MenuTile
            title="MOVIES"
            icon="🎬"
            colors={['#FF6B6B', '#FF8E53']}
            onPress={() => router.push('/movies')}
          />

          {/* SERIES */}
          <MenuTile
            title="SERIES"
            icon="🎭"
            colors={['#9B59B6', '#8E44AD']}
            onPress={() => router.push('/series')}
          />

          {/* CATCH UP */}
          <MenuTile
            title="CATCH UP"
            icon="⏰"
            colors={['#2ECC71', '#27AE60']}
            onPress={() => router.push('/catchup')}
          />

          {/* MULTISCREEN */}
          <MenuTile
            title="MULTISCREEN"
            icon="📱"
            colors={['#2ECC71', '#27AE60']}
            onPress={() => router.push('/multiscreen')}
          />

          {/* SETTINGS */}
          <MenuTile
            title="SETTINGS"
            icon="⚙️"
            colors={['#2ECC71', '#27AE60']}
            onPress={() => router.push('/settings')}
          />
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Expiração: {user?.expiration_date 
            ? format(new Date(user.expiration_date), 'dd MMM, yyyy', { locale: ptBR })
            : 'N/A'}
        </Text>
        <Text style={styles.footerText}>
          Logado: {user?.username || 'Usuário'}
        </Text>
      </View>
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
  headerLeft: {
    flex: 1,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dateText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 4,
  },
  logoutButton: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    borderRadius: 6,
  },
  logoutText: {
    color: '#FF6B6B',
    fontSize: 12,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 20,
  },
  tile: {
    width: (width - 60) / 3,
    height: 150,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  largeTile: {
    width: (width - 60) / 3,
    height: 320,
  },
  tileGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tileIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  tileText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  footerText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});

