import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearCachedChannels } from '../utils/cache';

const SETTINGS_KEY = '@ultraiptv_settings_v1';

type StreamFormat = 'adaptive' | 'direct';
type ExternalPlayer = 'internal' | 'vlc' | 'mxplayer';

interface AppSettings {
  timeFormat24h: boolean;
  language: 'pt-BR' | 'en' | 'es';
  parentalControlEnabled: boolean;
  parentalPinHash: string | null;
  blockedKeywords: string[];
  autoRefreshContent: boolean;
  autoRetryPlayback: boolean;
  autoCleanCache: boolean;
  streamFormat: StreamFormat;
  externalPlayer: ExternalPlayer;
}

interface SettingsContextValue {
  settings: AppSettings;
  loaded: boolean;
  updateSettings: (partial: Partial<AppSettings>) => void;
  enableParentalControl: (pin: string) => void;
  disableParentalControl: () => void;
  validatePin: (pin: string) => boolean;
  clearCachedContent: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  timeFormat24h: true,
  language: 'pt-BR',
  parentalControlEnabled: false,
  parentalPinHash: null,
  blockedKeywords: ['adulto', 'xxx', '18+', 'hot', 'playboy'],
  autoRefreshContent: true,
  autoRetryPlayback: true,
  autoCleanCache: false,
  streamFormat: 'adaptive',
  externalPlayer: 'internal',
};

const SettingsContext = createContext<SettingsContextValue>({
  settings: defaultSettings,
  loaded: false,
  updateSettings: () => {},
  enableParentalControl: () => {},
  disableParentalControl: () => {},
  validatePin: () => false,
  clearCachedContent: async () => {},
});

const hashPin = (pin: string) => {
  return pin.split('').reverse().join('') + '#ultra';
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);
  const AUTO_CLEAN_INTERVAL = Number(process.env.EXPO_PUBLIC_AUTOCLEAN_INTERVAL || 15 * 60 * 1000);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setSettings({ ...defaultSettings, ...parsed });
        }
      } catch (error) {
        console.warn('Erro ao carregar configurações', error);
      } finally {
        if (Platform.OS === 'web') {
          try {
            // Log para investigação do prompt de idioma observado no navegador
            // Mostra o idioma do navegador e o estado atual das configurações carregadas
            // eslint-disable-next-line no-console
            console.log('[SETTINGS] navigator.language:', (window.navigator && (window.navigator as any).language) || (window.navigator as any).userLanguage || null);
            // eslint-disable-next-line no-console
            console.log('[SETTINGS] navigator.languages:', (window.navigator && (window.navigator as any).languages) || null);
          } catch (e) {}
        }
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)).catch((error) => {
      console.warn('Erro ao salvar configurações', error);
    });
  }, [settings, loaded]);

  useEffect(() => {
    if (!loaded) return;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const executeCleanUp = async () => {
      await clearCachedChannels();
    };

    if (settings.autoCleanCache) {
      executeCleanUp();
      intervalId = setInterval(executeCleanUp, AUTO_CLEAN_INTERVAL);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [settings.autoCleanCache, loaded, AUTO_CLEAN_INTERVAL]);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const enableParentalControl = useCallback((pin: string) => {
    if (!pin || pin.length < 4) return;
    setSettings((prev) => ({
      ...prev,
      parentalControlEnabled: true,
      parentalPinHash: hashPin(pin),
    }));
  }, []);

  const disableParentalControl = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      parentalControlEnabled: false,
      parentalPinHash: null,
    }));
  }, []);

  const validatePin = useCallback((pin: string) => {
    if (!pin || !settings.parentalPinHash) return false;
    return settings.parentalPinHash === hashPin(pin);
  }, [settings.parentalPinHash]);

  const clearCachedContent = useCallback(async () => {
    await clearCachedChannels();
  }, []);

  const value = useMemo<SettingsContextValue>(() => ({
    settings,
    loaded,
    updateSettings,
    enableParentalControl,
    disableParentalControl,
    validatePin,
    clearCachedContent,
  }), [settings, loaded, updateSettings, enableParentalControl, disableParentalControl, validatePin, clearCachedContent]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}


