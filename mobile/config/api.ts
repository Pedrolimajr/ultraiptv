// API Externa de Conteúdo IPTV
export const API_URL = 'http://aguacomgas.shop';

// Backend API (se necessário)
export const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  // API Externa
  LIVE: `${API_URL}/live`,
  MOVIES: `${API_URL}/movies`,
  SERIES: `${API_URL}/series`,
  EPG: `${API_URL}/epg`,
  PROFILE: `${API_URL}/profile`,
  LOGIN: `${API_URL}/auth/login`,
  
  // Backend API
  BACKEND_AUTH: `${BACKEND_URL}/api/auth`,
  BACKEND_USERS: `${BACKEND_URL}/api/users`,
  BACKEND_LOGS: `${BACKEND_URL}/api/logs`,
};

