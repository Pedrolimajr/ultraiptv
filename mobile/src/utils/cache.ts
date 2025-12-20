import AsyncStorage from '@react-native-async-storage/async-storage';

const CHANNELS_KEY = '@ultraiptv_channels_v1';
const CHANNELS_TTL_MS = 1000 * 60 * 10; // 10 minutos

export async function cacheChannels(list: any[]) {
  try {
    const payload = { ts: Date.now(), data: list };
    await AsyncStorage.setItem(CHANNELS_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('cacheChannels error', e);
  }
}

export async function getCachedChannels(): Promise<any[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CHANNELS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.ts || !parsed.data) return null;
    if (Date.now() - parsed.ts > CHANNELS_TTL_MS) {
      await AsyncStorage.removeItem(CHANNELS_KEY);
      return null;
    }
    return parsed.data;
  } catch (e) {
    console.warn('getCachedChannels error', e);
    return null;
  }
}

export async function clearCachedChannels() {
  try {
    await AsyncStorage.removeItem(CHANNELS_KEY);
  } catch (e) {
    console.warn('clearCachedChannels error', e);
  }
}