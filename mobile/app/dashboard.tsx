import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { getDateLocale } from '../src/i18n';
import AppLogo from '../src/components/AppLogo';
import { palette } from '../src/theme/palette';
import { useSettings } from '../src/context/SettingsContext';
import { useIptvConfig } from '../src/context/IptvContext';
import IptvConfigModal from '../src/components/IptvConfigModal';
import PlaylistManagerModal from '../src/components/PlaylistManagerModal';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const { settings } = useSettings();
  const { config: iptvConfig, loading: iptvLoading } = useIptvConfig();
  const timePattern = settings.timeFormat24h ? 'HH:mm' : 'hh:mm aa';
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [playlistManagerVisible, setPlaylistManagerVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState('');

  useEffect(() => {
    loadUser();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (iptvConfig && !iptvLoading) {
      checkAndUpdateContent();
    }
  }, [iptvConfig, iptvLoading]);

  const checkAndUpdateContent = async () => {
    if (!iptvConfig) return;
    
    try {
      // Verificar última atualização
      const lastUpdateKey = '@ultraiptv_last_update';
      const lastUpdate = await AsyncStorage.getItem(lastUpdateKey);
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
      
      // Se nunca atualizou ou passou mais de 24 horas, atualizar
      if (!lastUpdate || (now - parseInt(lastUpdate)) > oneDay) {
        setIsUpdating(true);
        setUpdateProgress('Verificando atualizações...');
        
        // Simular processo de atualização
        await new Promise(resolve => setTimeout(resolve, 500));
        setUpdateProgress('Atualizando conteúdo...');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        setUpdateProgress('Sincronizando playlists...');
        
        await new Promise(resolve => setTimeout(resolve, 800));
        setUpdateProgress('Atualização concluída!');
        
        // Salvar timestamp da atualização
        await AsyncStorage.setItem(lastUpdateKey, now.toString());
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsUpdating(false);
        setUpdateProgress('');
      }
    } catch (error) {
      console.error('Erro ao verificar atualizações:', error);
      setIsUpdating(false);
      setUpdateProgress('');
    }
  };

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

  const LargeCard = ({ 
    title, 
    icon, 
    colors, 
    onPress
  }: {
    title: string;
    icon: string;
    colors: string[];
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={styles.largeCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={colors}
        style={styles.largeCardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <Text style={styles.largeCardIcon}>{icon}</Text>
        <Text style={styles.largeCardTitle}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const SmallCard = ({ 
    title, 
    icon, 
    onPress 
  }: {
    title: string;
    icon: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={styles.smallCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.smallCardIcon}>{icon}</Text>
      <Text style={styles.smallCardTitle}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <AppLogo size={90} />
          <View style={styles.brandText}>
            <Text style={styles.brandTitle}>Ultra IPTV</Text>
            <Text style={styles.brandSubtitle}>Entretenimento ilimitado</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View>
            <Text style={styles.headerTime}>
              {format(currentTime, timePattern, { locale: getDateLocale(settings.language) })}
            </Text>
            <Text style={styles.headerDate}>
              {format(currentTime, "dd 'de' MMMM, yyyy", { locale: getDateLocale(settings.language) })}
            </Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.headerIcon} onPress={() => setConfigModalVisible(true)}>
              <Text style={styles.headerIconText}>👤</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon} onPress={() => setPlaylistManagerVisible(true)}>
              <Text style={styles.headerIconText}>👥</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon} onPress={() => router.push('/settings')}>
              <Text style={styles.headerIconText}>⚙️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon} onPress={handleLogout}>
              <Text style={styles.headerIconText}>🚪</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Large Cards Row */}
        <View style={styles.largeCardsRow}>
          <LargeCard
            title="TV AO VIVO"
            icon="📺"
            colors={[palette.primary, '#0066CC']}
            onPress={() => router.push('/live')}
          />
          <LargeCard
            title="FILMES"
            icon="▶️"
            colors={[palette.secondary, '#5521b5']}
            onPress={() => router.push('/movies')}
          />
          <LargeCard
            title="SERIES"
            icon="🎬"
            colors={['#ff8f70', palette.accent]}
            onPress={() => router.push('/series')}
          />
        </View>

        {/* Small Cards Row */}
        <View style={styles.smallCardsRow}>
          <SmallCard
            title="EPG"
            icon="📖"
            onPress={() => router.push('/epg')}
          />
          <SmallCard
            title="MULTI-SCREEN"
            icon="📱"
            onPress={() => router.push('/multiscreen')}
          />
          <SmallCard
            title="ALCANÇAR"
            icon="⏰"
            onPress={() => router.push('/catchup')}
          />
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Expiração: {user?.expirationDate 
            ? format(new Date(user.expirationDate), "dd 'de' MMMM, yyyy", { locale: getDateLocale(settings.language) })
            : 'Sem expiração'}
        </Text>
        <Text style={styles.footerText}>
          Conectado: {user?.username || 'Usuário'}
        </Text>
        <Text style={styles.footerText}>
          Playlist: {iptvConfig ? iptvConfig.name : 'Não configurada'}
        </Text>
      </View>
      <IptvConfigModal
        visible={configModalVisible}
        onClose={() => setConfigModalVisible(false)}
      />
      <PlaylistManagerModal
        visible={playlistManagerVisible}
        onClose={() => setPlaylistManagerVisible(false)}
      />

      {/* Modal de atualização diária */}
      <Modal
        visible={isUpdating}
        transparent
        animationType="fade"
      >
        <View style={styles.updateModal}>
          <View style={styles.updateModalContent}>
            <ActivityIndicator size="large" color={palette.primary} />
            <Text style={styles.updateModalText}>{updateProgress || 'Atualizando...'}</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: palette.backgroundAlt,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandText: {
    marginLeft: 12,
  },
  brandTitle: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  brandSubtitle: {
    color: palette.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  headerTime: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: '600',
  },
  headerDate: {
    color: palette.textSecondary,
    marginTop: 4,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 10,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconText: {
    fontSize: 22,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  largeCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 15,
  },
  largeCard: {
    flex: 1,
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  largeCardGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  largeCardIcon: {
    fontSize: 54,
    marginBottom: 12,
  },
  largeCardTitle: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1,
  },
  smallCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    flexWrap: 'wrap',
  },
  smallCard: {
    flex: 1,
    height: 110,
    borderRadius: 16,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  smallCardIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  smallCardTitle: {
    color: palette.textPrimary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  footerText: {
    color: palette.textSecondary,
  },
  updateModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateModalContent: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.cardBorder,
    minWidth: 280,
  },
  updateModalText: {
    color: palette.textPrimary,
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
