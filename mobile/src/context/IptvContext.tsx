import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@ultraiptv_profiles_v1';
const LEGACY_STORAGE_KEY = '@ultraiptv_connection_v1';

export interface IptvConfig {
  name: string;
  username: string;
  password: string;
  baseUrl: string;
}

interface IptvProfile extends IptvConfig {
  id: string;
}

interface IptvContextValue {
  config: IptvConfig | null;
  loading: boolean;
  saveConfig: (cfg: IptvConfig) => Promise<void>;
  clearConfig: () => Promise<void>;
  profiles: IptvProfile[];
  activeId: string | null;
  addProfile: (cfg: IptvConfig) => Promise<void>;
  updateProfile: (id: string, cfg: IptvConfig) => Promise<void>;
  removeProfile: (id: string) => Promise<void>;
  setActiveProfile: (id: string) => Promise<void>;
}

const IptvContext = createContext<IptvContextValue>({
  config: null,
  loading: true,
  saveConfig: async () => {},
  clearConfig: async () => {},
  profiles: [],
  activeId: null,
  addProfile: async () => {},
  updateProfile: async () => {},
  removeProfile: async () => {},
  setActiveProfile: async () => {},
});

export function IptvProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<IptvProfile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const persist = useCallback(async (nextProfiles: IptvProfile[], nextActiveId: string | null) => {
    setProfiles(nextProfiles);
    setActiveId(nextActiveId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ profiles: nextProfiles, activeId: nextActiveId }));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setProfiles(parsed.profiles || []);
          setActiveId(parsed.activeId || null);
        } else {
          const legacy = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
          if (legacy) {
            const cfg: IptvConfig = JSON.parse(legacy);
            const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            const prof: IptvProfile = { id, ...cfg };
            await persist([prof], id);
            await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
          }
        }
      } catch (error) {
        console.warn('[IPTV] Falha ao carregar perfis', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [persist]);

  const activeProfile = useMemo(() => profiles.find(p => p.id === activeId) || null, [profiles, activeId]);
  const config = useMemo<IptvConfig | null>(() => {
    if (!activeProfile) return null;
    const { name, username, password, baseUrl } = activeProfile;
    return { name, username, password, baseUrl };
  }, [activeProfile]);

  const saveConfig = useCallback(async (cfg: IptvConfig) => {
    if (activeId) {
      const next = profiles.map(p => p.id === activeId ? { ...p, ...cfg } : p);
      await persist(next, activeId);
    } else {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const next = [...profiles, { id, ...cfg }];
      await persist(next, id);
    }
  }, [activeId, profiles, persist]);

  const addProfile = useCallback(async (cfg: IptvConfig) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const next = [...profiles, { id, ...cfg }];
    await persist(next, id);
  }, [profiles, persist]);

  const updateProfile = useCallback(async (id: string, cfg: IptvConfig) => {
    const next = profiles.map(p => p.id === id ? { ...p, ...cfg } : p);
    await persist(next, activeId);
  }, [profiles, activeId, persist]);

  const removeProfile = useCallback(async (id: string) => {
    const next = profiles.filter(p => p.id !== id);
    const nextActive = activeId === id ? (next[0]?.id ?? null) : activeId;
    await persist(next, nextActive);
  }, [profiles, activeId, persist]);

  const setActiveProfile = useCallback(async (id: string) => {
    await persist(profiles, id);
  }, [profiles, persist]);

  const clearConfig = useCallback(async () => {
    if (!activeId) return;
    const next = profiles.filter(p => p.id !== activeId);
    const nextActive = next[0]?.id ?? null;
    await persist(next, nextActive);
  }, [profiles, activeId, persist]);

  const value = useMemo(() => ({
    config,
    loading,
    saveConfig,
    clearConfig,
    profiles,
    activeId,
    addProfile,
    updateProfile,
    removeProfile,
    setActiveProfile,
  }), [config, loading, saveConfig, clearConfig, profiles, activeId, addProfile, updateProfile, removeProfile, setActiveProfile]);

  return (
    <IptvContext.Provider value={value}>
      {children}
    </IptvContext.Provider>
  );
}

export function useIptvConfig() {
  return useContext(IptvContext);
}

