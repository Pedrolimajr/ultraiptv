// API Externa de Conteúdo IPTV
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const API_URL = 'http://aguacomgas.shop';

const sanitizeUrl = (url: string) => url.replace(/\/$/, '');

const resolveExpoHost = (): string | null => {
  const manifest = Constants.manifest as (typeof Constants.manifest & {
    debuggerHost?: string;
    hostUri?: string;
  }) | null;

  const manifest2 = (Constants as any).manifest2 as {
    extra?: { expoClient?: { hostUri?: string } };
  } | null;

  return (
    Constants.expoConfig?.hostUri ??
    manifest?.debuggerHost ??
    manifest?.hostUri ??
    manifest2?.extra?.expoClient?.hostUri ??
    null
  );
};

const buildBackendUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  const envUrlAndroid = process.env.EXPO_PUBLIC_BACKEND_URL_ANDROID;

  // Prefer explicit Android override when present
  if (Platform.OS === 'android' && envUrlAndroid) {
    return sanitizeUrl(envUrlAndroid);
  }

  if (envUrl) {
    // If envUrl points to localhost, remap to Android emulator loopback
    try {
      const urlObj = new URL(envUrl);
      if (Platform.OS === 'android' && (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1')) {
        return `http://10.0.2.2${urlObj.port ? ':' + urlObj.port : ''}${urlObj.pathname !== '/' ? urlObj.pathname : ''}`;
      }
    } catch (e) {
      // ignore URL parsing errors and fall back to sanitize
    }

    return sanitizeUrl(envUrl);
  }

  const hostUri = resolveExpoHost();
  if (!hostUri) {
    return Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001';
  }

  let host = hostUri.split(':')[0] || 'localhost';

  if (Platform.OS === 'android' && (host === 'localhost' || host === '127.0.0.1')) {
    host = '10.0.2.2'; // Emulador Android acessa host via 10.0.2.2
  }

  return `http://${host}:3001`;
};

// Backend API
export const BACKEND_URL = buildBackendUrl();

export const API_ENDPOINTS = {
  // API Externa (via proxy do backend para evitar CORS)
  LIVE: `${BACKEND_URL}/api/content/live`,
  MOVIES: `${BACKEND_URL}/api/content/movies`,
  SERIES: `${BACKEND_URL}/api/content/series`,
  SERIES_DETAIL: (id: string | number) => `${BACKEND_URL}/api/content/series/${id}`,
  EPG: `${BACKEND_URL}/api/content/epg`,
  PROFILE: `${API_URL}/profile`,
  LOGIN: `${BACKEND_URL}/api/auth/login`,
  
  // Backend API
  BACKEND_AUTH: `${BACKEND_URL}/api/auth`,
  BACKEND_USERS: `${BACKEND_URL}/api/users`,
  BACKEND_LOGS: `${BACKEND_URL}/api/logs`,
  DIAGNOSTIC: `${BACKEND_URL}/api/diagnostic/test-iptv`,
};

