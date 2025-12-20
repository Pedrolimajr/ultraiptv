import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_PING_KEY = '@ultraiptv_watchdog_last_ping';
let intervalId: any = null;

export async function pingWatchdog() {
  const ts = Date.now();
  try {
    await AsyncStorage.setItem(LAST_PING_KEY, String(ts));
  } catch (e) {
    // ignore
  }
}

export async function getLastPing(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(LAST_PING_KEY);
    return raw ? Number(raw) : 0;
  } catch (e) {
    return 0;
  }
}

// Start a periodic check; if app is "stuck" (no ping), call onStuck
export function startWatchdog(onStuck: () => void, thresholdMs = 30000, checkIntervalMs = 10000) {
  stopWatchdog();
  intervalId = setInterval(async () => {
    try {
      const raw = await AsyncStorage.getItem(LAST_PING_KEY);
      const last = raw ? Number(raw) : 0;
      if (last === 0) return;
      if (Date.now() - last > thresholdMs) {
        onStuck();
      }
    } catch (e) {
      // ignore
    }
  }, checkIntervalMs);
}

export function stopWatchdog() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
