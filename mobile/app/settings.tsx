import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { getDateLocale, t } from '../src/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppLogo from '../src/components/AppLogo';
import { palette } from '../src/theme/palette';
import { useSettings } from '../src/context/SettingsContext';

interface SettingRowProps {
  icon: string;
  title: string;
  description?: string;
  onPress?: () => void;
  children?: React.ReactNode;
}

const SettingRow = ({ icon, title, description, onPress, children }: SettingRowProps) => (
  <TouchableOpacity
    style={styles.row}
    activeOpacity={onPress ? 0.8 : 1}
    onPress={onPress}
  >
    <View style={styles.rowIconWrapper}>
      <Text style={styles.rowIcon}>{icon}</Text>
    </View>
    <View style={styles.rowInfo}>
      <Text style={styles.rowTitle}>{title}</Text>
      {description && <Text style={styles.rowDescription}>{description}</Text>}
    </View>
    <View style={styles.rowAction}>
      {children}
    </View>
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [user, setUser] = useState<any>(null);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinMode, setPinMode] = useState<'enable' | 'disable'>('enable');
  const [pinError, setPinError] = useState('');
  const { settings, updateSettings, enableParentalControl, disableParentalControl, validatePin, clearCachedContent } = useSettings();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('@ultraiptv_user').then((data) => {
      if (data) setUser(JSON.parse(data));
    });
  }, []);

  const openPinModal = (mode: 'enable' | 'disable') => {
    setPinMode(mode);
    setPinInput('');
    setPinError('');
    setPinModalVisible(true);
  };

  const handlePinSubmit = () => {
    if (pinMode === 'enable') {
      if (pinInput.length !== 4) {
        setPinError('O PIN precisa ter 4 dígitos');
        return;
      }
      enableParentalControl(pinInput);
      Alert.alert('Controle dos Pais', 'Proteção ativada com sucesso.');
    } else {
      if (!validatePin(pinInput)) {
        setPinError('PIN incorreto');
        return;
      }
      disableParentalControl();
      Alert.alert('Controle dos Pais', 'Proteção desativada.');
    }
    setPinModalVisible(false);
  };

  const handleClearCache = async () => {
    await clearCachedContent();
    Alert.alert('Cache limpo', 'Lista de canais atualizada será baixada na próxima abertura.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: 42 }} />
        <AppLogo size={120} stacked />
        <View style={styles.headerRight}>
          <Text style={styles.clock}>
            {format(currentTime, settings.timeFormat24h ? 'HH:mm' : 'hh:mm aa', { locale: getDateLocale(settings.language) })}
          </Text>
          <Text style={styles.date}>
            {format(currentTime, "dd 'de' MMMM, yyyy", { locale: getDateLocale(settings.language) })}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>{t('settings.title.hello', settings.language)}, {user?.username || 'usuário'}</Text>
          <Text style={styles.heroSubtitle}>{t('settings.title.personalize', settings.language)}</Text>
          {user?.expirationDate && (
            <Text style={styles.heroMeta}>
              Expira em {format(new Date(user.expirationDate), "dd 'de' MMMM, yyyy", { locale: getDateLocale(settings.language) })}
            </Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>{t('settings.section.general', settings.language)}</Text>
        <View style={styles.card}>
          <SettingRow
            icon="🕒"
            title={t('settings.general.timeformat', settings.language)}
            description={t('settings.general.timeformat.desc', settings.language)}
          >
            <Switch
              value={settings.timeFormat24h}
              onValueChange={(value) => updateSettings({ timeFormat24h: value })}
              trackColor={{ true: palette.primary, false: palette.border }}
              thumbColor={settings.timeFormat24h ? '#fff' : '#777'}
            />
          </SettingRow>

          <SettingRow
            icon="🔄"
            title={t('settings.general.autorefresh', settings.language)}
            description={t('settings.general.autorefresh.desc', settings.language)}
          >
            <Switch
              value={settings.autoRefreshContent}
              onValueChange={(value) => updateSettings({ autoRefreshContent: value })}
              trackColor={{ true: palette.primary, false: palette.border }}
              thumbColor={settings.autoRefreshContent ? '#fff' : '#777'}
            />
          </SettingRow>

          <SettingRow
            icon="🧽"
            title={t('settings.general.autoclean', settings.language)}
            description={t('settings.general.autoclean.desc', settings.language)}
          >
            <Switch
              value={settings.autoCleanCache}
              onValueChange={(value) => updateSettings({ autoCleanCache: value })}
              trackColor={{ true: palette.primary, false: palette.border }}
              thumbColor={settings.autoCleanCache ? '#fff' : '#777'}
            />
          </SettingRow>

          <SettingRow
            icon="🧹"
            title={t('settings.general.clearcache', settings.language)}
            description=""
          >
            <TouchableOpacity style={styles.actionButton} onPress={handleClearCache}>
              <Text style={styles.actionButtonText}>{t('settings.general.clearcache.button', settings.language)}</Text>
            </TouchableOpacity>
          </SettingRow>

          <SettingRow
            icon="🌐"
            title={t('settings.general.language', settings.language)}
            description=""
          >
            <View style={styles.segmented}>
              {[
                { code: 'pt-BR', label: 'PT-BR' },
                { code: 'en', label: 'EN' },
                { code: 'es', label: 'ES' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.code}
                  style={[
                    styles.segmentButton,
                    settings.language === (opt.code as any) && styles.segmentButtonActive,
                  ]}
                  onPress={() => updateSettings({ language: opt.code as any })}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      settings.language === (opt.code as any) && styles.segmentTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </SettingRow>
        </View>

        <Text style={styles.sectionTitle}>{t('settings.section.player', settings.language)}</Text>
        <View style={styles.card}>
          <SettingRow
            icon="▶️"
            title={t('settings.player.external', settings.language)}
            description={t('settings.player.external.desc', settings.language)}
            onPress={() => updateSettings({ externalPlayer: settings.externalPlayer === 'internal' ? 'vlc' : 'internal' })}
          >
            <Text style={styles.chip}>
              {settings.externalPlayer === 'internal' ? t('settings.player.external.internal', settings.language) : t('settings.player.external.vlc', settings.language)}
            </Text>
          </SettingRow>

          <SettingRow
            icon="📶"
            title={t('settings.player.streamformat', settings.language)}
            description={t('settings.player.streamformat.desc', settings.language)}
          >
            <View style={styles.segmented}>
              {['adaptive', 'direct'].map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.segmentButton,
                    settings.streamFormat === mode && styles.segmentButtonActive,
                  ]}
                  onPress={() => updateSettings({ streamFormat: mode as 'adaptive' | 'direct' })}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      settings.streamFormat === mode && styles.segmentTextActive,
                    ]}
                  >
                    {mode === 'adaptive' ? t('settings.stream.adaptive', settings.language) : t('settings.stream.direct', settings.language)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </SettingRow>
        </View>

        <Text style={styles.sectionTitle}>{t('settings.section.parental', settings.language)}</Text>
        <View style={styles.card}>
          <SettingRow
            icon="🛡️"
            title={t('settings.parental.protection', settings.language)}
            description={
              settings.parentalControlEnabled
                ? t('settings.parental.enabled', settings.language)
                : t('settings.parental.disabled', settings.language)
            }
            onPress={() => openPinModal(settings.parentalControlEnabled ? 'disable' : 'enable')}
          >
            <Text style={[styles.chip, settings.parentalControlEnabled && styles.chipSuccess]}>
              {settings.parentalControlEnabled ? t('settings.parental.active', settings.language) : t('settings.parental.inactive', settings.language)}
            </Text>
          </SettingRow>
        </View>

        <Text style={styles.sectionTitle}>{t('settings.section.tools', settings.language)}</Text>
        <View style={styles.card}>
          <SettingRow
            icon="📺"
            title={t('settings.tools.multiscreen', settings.language)}
            description={t('settings.tools.multiscreen.desc', settings.language)}
            onPress={() => router.push('/multiscreen')}
          >
            <Text style={styles.rowLink}>{t('settings.tools.open', settings.language)}</Text>
          </SettingRow>
          <SettingRow
            icon="📊"
            title={t('settings.tools.speedtest', settings.language)}
            description={t('settings.tools.speedtest.desc', settings.language)}
            onPress={() => Linking.openURL('https://fast.com')}
          >
            <Text style={styles.rowLink}>{t('settings.tools.test', settings.language)}</Text>
          </SettingRow>
          <SettingRow
            icon="🗓️"
            title={t('settings.tools.epg', settings.language)}
            description={t('settings.tools.epg.desc', settings.language)}
            onPress={() => router.push('/epg')}
          >
            <Text style={styles.rowLink}>{t('settings.tools.seeGuide', settings.language)}</Text>
          </SettingRow>
          <SettingRow
            icon="🔒"
            title={t('settings.tools.vpn', settings.language)}
            description={t('settings.tools.vpn.desc', settings.language)}
            onPress={() => Linking.openURL('https://play.google.com/store/search?q=VPN&c=apps')}
          >
            <Text style={styles.rowLink}>{t('settings.tools.recommendations', settings.language)}</Text>
          </SettingRow>
        </View>
      </ScrollView>

      <Modal visible={pinModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {pinMode === 'enable' ? 'Ativar' : 'Desativar'} controle dos pais
            </Text>
            <Text style={styles.modalSubtitle}>
              Digite um PIN de 4 dígitos
            </Text>
            <TextInput
              style={styles.pinInput}
              keyboardType="numeric"
              secureTextEntry
              maxLength={4}
              value={pinInput}
              onChangeText={setPinInput}
            />
            {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setPinModalVisible(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={handlePinSubmit}
              >
                <Text style={styles.modalButtonPrimaryText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
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
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
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
  headerRight: {
    alignItems: 'flex-end',
  },
  clock: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  date: {
    color: palette.textSecondary,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  heroTitle: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: palette.textSecondary,
    marginTop: 6,
  },
  heroMeta: {
    marginTop: 12,
    color: palette.primary,
  },
  sectionTitle: {
    color: palette.textSecondary,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  rowIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: palette.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowIcon: {
    fontSize: 20,
  },
  rowInfo: {
    flex: 1,
  },
  rowTitle: {
    color: palette.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  rowDescription: {
    color: palette.textSecondary,
    fontSize: 12,
  },
  rowAction: {
    marginLeft: 12,
  },
  actionButton: {
    backgroundColor: palette.primary,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  actionButtonText: {
    color: '#00111a',
    fontWeight: '600',
  },
  chip: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 10,
    color: palette.textSecondary,
    fontSize: 12,
  },
  chipSuccess: {
    borderColor: palette.success,
    color: palette.success,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: palette.backgroundAlt,
    borderRadius: 20,
    overflow: 'hidden',
  },
  segmentButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  segmentButtonActive: {
    backgroundColor: palette.primary,
  },
  segmentText: {
    color: palette.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#00111a',
  },
  rowLink: {
    color: palette.primary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  modalTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: palette.textSecondary,
    marginTop: 6,
  },
  pinInput: {
    marginTop: 16,
    backgroundColor: palette.backgroundAlt,
    borderRadius: 12,
    padding: 12,
    color: palette.textPrimary,
    fontSize: 20,
    textAlign: 'center',
  },
  pinError: {
    color: palette.accent,
    marginTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 12,
  },
  modalButtonSecondary: {
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  modalButtonSecondaryText: {
    color: palette.textSecondary,
  },
  modalButtonPrimary: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: palette.primary,
    borderRadius: 12,
  },
  modalButtonPrimaryText: {
    color: '#00111a',
    fontWeight: '700',
  },
});
