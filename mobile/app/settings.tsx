import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function SettingsScreen() {
  const router = useRouter();
  const [parentalControl, setParentalControl] = useState(false);
  const [timeFormat24, setTimeFormat24] = useState(true);
  const [externalPlayer, setExternalPlayer] = useState(false);

  const SettingItem = ({ 
    icon, 
    title, 
    onPress, 
    rightComponent 
  }: {
    icon: string;
    title: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.settingIcon}>{icon}</Text>
      <Text style={styles.settingTitle}>{title}</Text>
      {rightComponent && (
        <View style={styles.settingRight}>{rightComponent}</View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CONFIGURAÇÕES</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>ULTRAIPTV</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Formato da Hora */}
        <SettingItem
          icon="🕐"
          title="Formato da hora"
          rightComponent={
            <Switch
              value={timeFormat24}
              onValueChange={setTimeFormat24}
              trackColor={{ false: '#767577', true: '#00D9FF' }}
              thumbColor="#FFFFFF"
            />
          }
        />

        {/* Controle dos Pais */}
        <SettingItem
          icon="🛡️"
          title="Controle dos pais"
          onPress={() => {
            Alert.prompt(
              'Controle dos Pais',
              'Digite o PIN:',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'OK',
                  onPress: (pin) => {
                    if (pin && pin.length === 4) {
                      setParentalControl(true);
                      Alert.alert('Sucesso', 'Controle dos pais ativado');
                    }
                  },
                },
              ],
              'secure-text'
            );
          }}
          rightComponent={
            <Switch
              value={parentalControl}
              onValueChange={setParentalControl}
              trackColor={{ false: '#767577', true: '#00D9FF' }}
              thumbColor="#FFFFFF"
            />
          }
        />

        {/* Seleção do Mediaplayer */}
        <SettingItem
          icon="▶️"
          title="Seleção do Mediaplayer"
          onPress={() => {
            Alert.alert(
              'Mediaplayer',
              'Escolha o player:',
              [
                { text: 'Player Interno', onPress: () => setExternalPlayer(false) },
                { text: 'Player Externo', onPress: () => setExternalPlayer(true) },
              ]
            );
          }}
        />

        {/* Configurações do Mediaplayer */}
        <SettingItem
          icon="⚙️"
          title="Configurações do Mediaplayer"
          onPress={() => Alert.alert('Em desenvolvimento')}
        />

        {/* Mediaplayers Externos */}
        <SettingItem
          icon="🔄"
          title="Mediaplayers Externos"
          onPress={() => Alert.alert('Em desenvolvimento')}
        />

        {/* MULTI-SCREEN */}
        <SettingItem
          icon="📱"
          title="MULTI-SCREEN"
          onPress={() => router.push('/multiscreen')}
        />

        {/* Teste de Velocidade */}
        <SettingItem
          icon="📊"
          title="Teste de velocidade"
          onPress={() => {
            Alert.alert('Teste de Velocidade', 'Iniciando teste...');
            // Implementar teste de velocidade
          }}
        />

        {/* VPN */}
        <SettingItem
          icon="🔒"
          title="VPN"
          onPress={() => {
            Alert.alert(
              'VPN',
              'Abrir configurações de VPN?',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Abrir', onPress: () => {} },
              ]
            );
          }}
        />

        {/* Switch Device Mode */}
        <SettingItem
          icon="📺"
          title="Switch Device Mode"
          onPress={() => Alert.alert('Em desenvolvimento')}
        />

        {/* Backup & Restore */}
        <SettingItem
          icon="☁️"
          title="Backup & Restore"
          onPress={() => {
            Alert.alert(
              'Backup & Restore',
              'Escolha uma opção:',
              [
                { text: 'Fazer Backup', onPress: () => {} },
                { text: 'Restaurar', onPress: () => {} },
                { text: 'Cancelar', style: 'cancel' },
              ]
            );
          }}
        />
      </ScrollView>
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
    textTransform: 'uppercase',
  },
  headerRight: {
    width: 80,
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.2)',
  },
  settingIcon: {
    fontSize: 28,
    marginRight: 15,
  },
  settingTitle: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  settingRight: {
    marginLeft: 10,
  },
});

