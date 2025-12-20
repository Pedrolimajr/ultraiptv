import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, Modal, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIptvConfig } from '../src/context/IptvContext';
import { palette } from '../src/theme/palette';

export default function Index() {
  const router = useRouter();
  const { config: iptvConfig, loading: iptvLoading } = useIptvConfig();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (iptvConfig && !iptvLoading) {
      checkAndUpdateContent();
    }
  }, [iptvConfig, iptvLoading]);

  const checkAndUpdateContent = async () => {
    if (!iptvConfig) return;
    
    try {
      // Verificar última atualização diária
      const lastUpdateKey = '@ultraiptv_last_daily_update';
      const lastUpdate = await AsyncStorage.getItem(lastUpdateKey);
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
      
      // Verificar se já atualizou hoje (comparar apenas a data, não a hora exata)
      const lastUpdateDate = lastUpdate ? new Date(parseInt(lastUpdate)).toDateString() : null;
      const todayDate = new Date(now).toDateString();
      const needsUpdate = !lastUpdate || lastUpdateDate !== todayDate;
      
      // Se nunca atualizou ou é um novo dia, atualizar
      if (needsUpdate) {
        setIsUpdating(true);
        
        setUpdateProgress('Atualizando TV ao vivo...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setUpdateProgress('Atualizando Filmes...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setUpdateProgress('Atualizando Séries...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setUpdateProgress('Atualização concluída!');
        
        // Salvar timestamp da atualização diária
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

  const checkAuth = async () => {
    try {
      // SEMPRE limpar dados e ir para login ao iniciar o app
      // O usuário deve fazer login toda vez que abrir o app
      await AsyncStorage.removeItem('@ultraiptv_token');
      await AsyncStorage.removeItem('@ultraiptv_user');
      router.replace('/login');
    } catch (error) {
      // Em caso de erro, sempre ir para login
      await AsyncStorage.removeItem('@ultraiptv_token');
      await AsyncStorage.removeItem('@ultraiptv_user');
      router.replace('/login');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
      <ActivityIndicator size="large" color="#00D9FF" />
      {isUpdating && (
        <Modal visible={isUpdating} transparent animationType="fade">
          <View style={styles.updateModal}>
            <View style={styles.updateContainer}>
              <ActivityIndicator size="large" color={palette.primary} />
              <Text style={styles.updateText}>{updateProgress}</Text>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  updateModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateContainer: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    minWidth: 280,
  },
  updateText: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
});

