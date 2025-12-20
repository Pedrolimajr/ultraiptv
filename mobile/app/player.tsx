import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  Pressable,
  Animated,
  PanResponder,
  Image,
  FlatList,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, BackHandler } from 'react-native';
import { BACKEND_URL, API_ENDPOINTS } from '../config/api';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { pingWatchdog } from '../src/utils/watchdog';
import { LinearGradient } from 'expo-linear-gradient';
import { palette } from '../src/theme/palette';
import { useSettings } from '../src/context/SettingsContext';
import { useIptvConfig } from '../src/context/IptvContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { buildIptvHeaders } from '../src/utils/iptv';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface ContentItem {
  id: string;
  title: string;
  poster?: string;
  logo?: string;
  stream_url: string;
  direct_url?: string;
  category?: string;
  type: 'live' | 'movie' | 'series';
}

export default function PlayerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const videoRef = useRef<Video>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mouseMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [status, setStatus] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [storedParams, setStoredParams] = useState<any>(null);
  const [volume, setVolume] = useState(1);
  const [isLocked, setIsLocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedQuality, setSelectedQuality] = useState<string>('auto');
  const [showContentMenu, setShowContentMenu] = useState(false);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentSearchQuery, setContentSearchQuery] = useState('');
  
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const menuSlideAnim = useRef(new Animated.Value(0)).current;
  const progressBarRef = useRef<View>(null);
  const isPointerActiveRef = useRef(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [savedProgress, setSavedProgress] = useState<number | null>(null);
  const [progressBarLayout, setProgressBarLayout] = useState({ x: 0, width: 0 });
  
  const { settings } = useSettings();
  const { config: iptvConfig, loading: iptvLoading } = useIptvConfig();
  const MAX_RETRIES = settings.autoRetryPlayback ? 5 : 2;

  // Carregar parâmetros salvos
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('@ultraiptv_playback');
        if (raw) {
          const parsed = JSON.parse(raw);
          setStoredParams(parsed);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        const raw = window.sessionStorage.getItem('ultraiptv_playback');
        if (raw) {
          const parsed = JSON.parse(raw);
          setStoredParams((prev: any) => prev || parsed);
        }
      } catch {}
    }
  }, []);

  const getParam = (name: string) => {
    const val: any = (params as any)[name];
    const fromParams = Array.isArray(val) ? val[0] : val;
    if (typeof fromParams === 'string') return fromParams;
    if (Platform.OS === 'web') {
      try {
        const url = new URL(window.location.href);
        const qp = url.searchParams.get(name);
        if (qp) return qp;
      } catch {}
    }
    if (storedParams && typeof storedParams[name] === 'string') {
      return storedParams[name];
    }
    return undefined;
  };

  const uriCandidates: any[] = [getParam('uri'), getParam('url'), getParam('src'), getParam('stream'), getParam('playbackUrl')];
  const firstCandidate = uriCandidates.find((v) => typeof v !== 'undefined' && v !== null);
  const rawUri = Array.isArray(firstCandidate) ? firstCandidate[0] : firstCandidate;
  let uri = typeof rawUri === 'string' ? rawUri : '';
  if (uri) {
    const trimmed = uri.trim();
    if (trimmed === '' || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
      uri = '';
    } else {
      uri = trimmed;
    }
  }
  const playUri = uri && /%[0-9A-Fa-f]{2}/.test(uri) ? decodeURIComponent(uri) : uri;
  const effectiveUri = Platform.OS === 'web'
    ? (playUri && playUri.trim().length > 0
        ? `${BACKEND_URL}/api/content/proxy?url=${encodeURIComponent(playUri)}`
        : '')
    : playUri;
  const rawTitle = getParam('title') ?? (Array.isArray(params.title) ? params.title[0] : params.title);
  const title = typeof rawTitle === 'string' ? rawTitle : '';
  const rawType = getParam('type') ?? (Array.isArray(params.type) ? params.type[0] : params.type);
  const type = typeof rawType === 'string' ? rawType : '';
  const sid = getParam('sid') ?? (typeof (params as any).sid === 'string' ? (params as any).sid : Array.isArray((params as any).sid) ? (params as any).sid[0] : '');
  const ext = getParam('ext') ?? (typeof (params as any).ext === 'string' ? (params as any).ext : Array.isArray((params as any).ext) ? (params as any).ext[0] : '');
  const from = getParam('from');
  const seriesIdParam = getParam('seriesId') ?? (typeof (params as any).seriesId === 'string' ? (params as any).seriesId : Array.isArray((params as any).seriesId) ? (params as any).seriesId[0] : '');

  const sanitizeBase = (url: string) => String(url || '')
    .trim()
    .replace(/^['"`]+|['"`]+$/g, '')
    .replace(/\/+$/g, '')
    .replace(/\/player_api\.php$/i, '');
  const ensureHttp = (url: string) => (/^https?:\/\//i.test(url) ? url : `http://${url}`);
  const xtreamRoot = iptvConfig ? ensureHttp(sanitizeBase(iptvConfig.baseUrl)) : '';
  const folderMap: Record<string, string> = { live: 'live', movie: 'movie', movies: 'movie', series: 'series' };
  const sanitizeExt = (e: string, vodHint: boolean) => {
    const v = String(e || '').trim().toLowerCase();
    if (!v || v === 'null' || v === 'undefined' || /[^a-z0-9]/.test(v) || v.length > 4) {
      return vodHint ? 'mp4' : 'm3u8';
    }
    if (['mp4','m3u8','ts','mkv','avi'].includes(v)) return v;
    return vodHint ? 'mp4' : 'm3u8';
  };
  const fallbackBuildUrl = () => {
    if (!iptvConfig || !sid) return '';
    const normalizedType = (type || '').toLowerCase();
    const folder = folderMap[normalizedType] || (normalizedType ? 'live' : 'movie');
    const vodHint = folder !== 'live';
    const extension = sanitizeExt(ext, vodHint);
    return `${xtreamRoot}/${folder}/${iptvConfig.username}/${iptvConfig.password}/${sid}.${extension}`;
  };

  const fallback = fallbackBuildUrl();
  const normalizedType = (type || '').toLowerCase();
  const isVod = ['movie', 'movies', 'series'].includes(normalizedType) || (!!sid && !!ext);
  const preferDirect = settings.streamFormat === 'direct';
  const finalUri = isVod
    ? (preferDirect
        ? ((fallback && fallback.trim().length > 0)
            ? (Platform.OS === 'web' ? `${BACKEND_URL}/api/content/proxy?url=${encodeURIComponent(fallback)}` : fallback)
            : (effectiveUri || ''))
        : ((effectiveUri && effectiveUri.trim().length > 0)
            ? effectiveUri
            : ((fallback && fallback.trim().length > 0)
                ? (Platform.OS === 'web' ? `${BACKEND_URL}/api/content/proxy?url=${encodeURIComponent(fallback)}` : fallback)
                : '')))
    : ((effectiveUri && effectiveUri.trim().length > 0)
        ? effectiveUri
        : ((fallback && fallback.trim().length > 0)
            ? (Platform.OS === 'web' ? `${BACKEND_URL}/api/content/proxy?url=${encodeURIComponent(fallback)}` : fallback)
            : ''));

  // Ocultação automática dos controles após 3 segundos
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (!isLocked && isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying && !isLocked) {
          Animated.timing(controlsOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setShowControls(false);
          });
        }
      }, 3000);
    }
  }, [isPlaying, isLocked, controlsOpacity]);

  // Mostrar controles e resetar timer
  const showControlsWithTimeout = useCallback(() => {
    setShowControls(true);
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    resetControlsTimeout();
  }, [controlsOpacity, resetControlsTimeout]);

  // Detecção de movimento do mouse (web)
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleMouseMove = () => {
        if (!isLocked) {
          showControlsWithTimeout();
        }
        if (mouseMoveTimeoutRef.current) {
          clearTimeout(mouseMoveTimeoutRef.current);
        }
        mouseMoveTimeoutRef.current = setTimeout(() => {
          // Mouse parado - não fazer nada, deixar o timeout normal funcionar
        }, 100);
      };

      window.addEventListener('mousemove', handleMouseMove);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        if (mouseMoveTimeoutRef.current) {
          clearTimeout(mouseMoveTimeoutRef.current);
        }
      };
    }
  }, [isLocked, showControlsWithTimeout]);

  // Detecção de teclas (TV/controle remoto)
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleKeyPress = (e: any) => {
        if (!isLocked) {
          showControlsWithTimeout();
        }
      };
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [isLocked, showControlsWithTimeout]);

  // Resetar timeout quando o vídeo começar a tocar
  useEffect(() => {
    if (isPlaying) {
      resetControlsTimeout();
    }
  }, [isPlaying, resetControlsTimeout]);

  // Carregar progresso salvo
  useEffect(() => {
    const loadSavedProgress = async () => {
      if (!isVod || !sid) return;
      try {
        // Primeiro tenta buscar do parâmetro savedPosition (se veio dos recentes)
        const savedPositionParam = getParam('savedPosition');
        if (savedPositionParam) {
          const pos = parseFloat(savedPositionParam);
          if (!isNaN(pos) && pos > 0) {
            console.log('[PLAYER] ✅ Progresso encontrado nos parâmetros:', pos, 'segundos');
            setSavedProgress(pos);
            return;
          }
        }
        
        // Senão, busca do storage - tentar com diferentes IDs
        const seriesIdParam = getParam('seriesId');
        const keysToTry = [];
        
        if (normalizedType === 'series') {
          // Para séries, tentar com seriesId primeiro (mais confiável)
          if (seriesIdParam) {
            keysToTry.push(`@ultraiptv_progress_series_${seriesIdParam}`);
          }
          // Depois tentar com sid (pode ser ID do episódio)
          keysToTry.push(`@ultraiptv_progress_series_${sid}`);
        } else {
          keysToTry.push(`@ultraiptv_progress_movie_${sid}`);
        }
        
        // Tentar cada chave até encontrar
        for (const key of keysToTry) {
          try {
            const saved = await AsyncStorage.getItem(key);
            if (saved) {
              const progress = JSON.parse(saved);
              if (progress.position && progress.position > 0) {
                // Se tiver duração, verificar porcentagem
                if (progress.duration && progress.duration > 0) {
                  const percentage = (progress.position / progress.duration) * 100;
                  if (percentage < 90) {
                    console.log('[PLAYER] ✅ Progresso encontrado no storage:', progress.position, 'segundos (', percentage.toFixed(1), '%)');
                    setSavedProgress(progress.position);
                    return;
                  }
                } else {
                  // Se não tiver duração, usar a posição mesmo assim
                  console.log('[PLAYER] ✅ Progresso encontrado no storage (sem duração):', progress.position, 'segundos');
                  setSavedProgress(progress.position);
                  return;
                }
              }
            }
          } catch (e) {
            // Continuar tentando outras chaves
            continue;
          }
        }
        
        console.log('[PLAYER] ⚠️ Nenhum progresso salvo encontrado');
      } catch (error) {
        console.warn('[PLAYER] Erro ao carregar progresso salvo:', error);
      }
    };
    loadSavedProgress();
  }, [finalUri, sid, normalizedType, isVod]);

  // Salvar progresso periodicamente
  useEffect(() => {
    if (!isVod || !sid) return;
    
    const saveProgress = async () => {
      try {
        // Salvar progresso apenas se tiver duração válida
        if (duration && duration > 0) {
          const key = normalizedType === 'series' 
            ? `@ultraiptv_progress_series_${sid}`
            : `@ultraiptv_progress_movie_${sid}`;
          const progress = {
            position: currentTime || 0,
            duration: duration,
            timestamp: Date.now(),
            title: title,
            type: normalizedType,
          };
          await AsyncStorage.setItem(key, JSON.stringify(progress));
        }
        
        // SEMPRE salvar em assistidos recentes, mesmo sem duration
        // Determinar o tipo correto - se for episódio de série, salvar como série
        const fromParam = getParam('from');
        let actualType = normalizedType;
        
        // Verificar se é série baseado no from ou no tipo
        if (fromParam === 'series' || normalizedType === 'series') {
          actualType = 'series';
        } else if (normalizedType === 'movie' || normalizedType === 'movies' || fromParam === 'movies') {
          actualType = 'movie';
        }
        
        // Garantir que só salve movie ou series
        if (actualType === 'movie' || actualType === 'series') {
          const recentKey = actualType === 'series' 
            ? '@ultraiptv_recent_watched_series' 
            : '@ultraiptv_recent_watched_movies';
          const recentRaw = await AsyncStorage.getItem(recentKey);
          const recentList = recentRaw ? JSON.parse(recentRaw) : [];
          
          // Para séries, usar o ID da série (não do episódio) se disponível
          let seriesId = sid;
          if (actualType === 'series') {
            if (seriesIdParam && seriesIdParam.trim() !== '') {
              seriesId = String(seriesIdParam).trim();
              console.log('[PLAYER] ✅ Usando seriesId dos parâmetros:', seriesId);
            } else if (fromParam === 'series') {
              // Se não tiver seriesId, tentar usar o sid (pode ser o ID da série se vier correto)
              seriesId = sid;
              console.log('[PLAYER] ⚠️ Usando sid como seriesId (fallback):', seriesId);
            }
          }
          
          // Para séries, extrair apenas o nome da série do título (remover " - Ep. X" ou " - T1 Ep. X")
          let seriesTitle = title;
          if (actualType === 'series') {
            if (title.includes(' - Ep.')) {
              seriesTitle = title.split(' - Ep.')[0].trim();
            } else if (title.includes(' - T')) {
              // Formato: "Nome da Série - T1 Ep. 1"
              seriesTitle = title.split(' - T')[0].trim();
            }
          }
          
          console.log('[PLAYER] 📝 Salvando assistido recente:', {
            actualType,
            seriesId,
            seriesTitle,
            sid,
            fromParam,
            seriesIdParam,
            currentTime,
            duration,
          });
          
          const existingIndex = recentList.findIndex((item: any) => {
            const itemId = String(item.sid || item.id || '').trim();
            const targetId = String(seriesId || '').trim();
            const matches = (itemId === targetId || item.sid === seriesId || item.id === seriesId) && item.type === actualType;
            if (matches) {
              console.log('[PLAYER] ✅ Item existente encontrado:', item.title, 'ID:', itemId);
            }
            return matches;
          });
          
          // Buscar poster/logo dos parâmetros ou do contexto
          const posterParam = getParam('poster');
          const logoParam = getParam('logo');
          const categoryParam = getParam('category');
          const directUrlParam = getParam('direct_url');
          
          const recentItem = {
            id: seriesId,
            sid: seriesId,
            title: seriesTitle,
            type: actualType,
            poster: posterParam || '',
            logo: logoParam || '',
            stream_url: finalUri,
            direct_url: directUrlParam || '',
            category: categoryParam || '',
            position: currentTime || 0,
            duration: duration || 0,
            lastWatched: Date.now(),
          };
          
          if (existingIndex >= 0) {
            recentList[existingIndex] = recentItem;
            console.log(`[PLAYER] ✅ Atualizado item existente em assistidos recentes: ${actualType} - ${seriesTitle} (ID: ${seriesId})`);
          } else {
            recentList.unshift(recentItem);
            console.log(`[PLAYER] ✅ Adicionado novo item em assistidos recentes: ${actualType} - ${seriesTitle} (ID: ${seriesId})`);
          }
          
          // Manter apenas os últimos 50 itens por tipo
          const limited = recentList.slice(0, 50);
          await AsyncStorage.setItem(recentKey, JSON.stringify(limited));
          console.log(`[PLAYER] ✅ Salvo em assistidos recentes: ${actualType} - ${seriesTitle} (ID: ${seriesId}), Total: ${limited.length} itens`);
        }
      } catch (error) {
        console.error('[PLAYER] ❌ Erro ao salvar progresso:', error);
      }
    };

    // Salvar imediatamente quando o vídeo começar a tocar (mesmo sem duration para séries)
    // e depois a cada 10 segundos
    if (isPlaying) {
      saveProgress();
    }
    
    const interval = setInterval(() => {
      if (isPlaying) {
        saveProgress();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [currentTime, duration, sid, normalizedType, isVod, title, finalUri, isPlaying, seriesIdParam]);

  // Carregar vídeo e entrar em tela cheia
  useEffect(() => {
    const loadVideo = async () => {
      if (videoRef.current && finalUri) {
        try {
          setLoading(true);
          
          // Carregar com posição salva se existir
          const initialPosition = savedProgress || 0;
          await videoRef.current.loadAsync(
            { uri: finalUri as string }, 
            { 
              shouldPlay: false, // Pausar inicialmente para restaurar posição
            }
          );
          
          if (initialPosition > 0 && savedProgress) {
            console.log(`[PLAYER] 🎬 Retomando vídeo de ${formatTime(initialPosition)}`);
            // Aguardar um pouco para garantir que o vídeo está pronto
            setTimeout(async () => {
              try {
                // Tentar múltiplas vezes para garantir que funciona
                for (let attempt = 0; attempt < 3; attempt++) {
                  try {
                    await new Promise(resolve => setTimeout(resolve, 300 + (attempt * 200)));
                    // initialPosition está em segundos, converter para milissegundos
                    const targetMillis = Math.round(initialPosition * 1000);
                    await videoRef.current?.setPositionAsync(targetMillis);
                    setCurrentTime(initialPosition);
                    await videoRef.current?.playAsync();
                    setIsPlaying(true);
                    console.log(`[PLAYER] ✅ Posição restaurada com sucesso: ${formatTime(initialPosition)}`);
                    return;
                  } catch (e) {
                    if (attempt === 2) {
                      throw e;
                    }
                    console.warn(`[PLAYER] Tentativa ${attempt + 1} falhou, tentando novamente...`);
                  }
                }
              } catch (e) {
                console.warn('[PLAYER] Erro ao restaurar posição após múltiplas tentativas:', e);
                // Se falhar, apenas iniciar normalmente
                try {
                  await videoRef.current?.playAsync();
                  setIsPlaying(true);
                } catch (playError) {
                  console.error('[PLAYER] Erro ao iniciar reprodução:', playError);
                }
              }
            }, 1000); // Aumentar delay inicial para dar mais tempo ao vídeo carregar
          } else {
            // Se não há progresso salvo, iniciar normalmente
            await videoRef.current.playAsync();
            setIsPlaying(true);
          }
          
          // Tela cheia automática - melhorado para web e mobile
          if (Platform.OS !== 'web') {
            // Tentar múltiplas vezes de forma mais agressiva
            const tryFullscreenMobile = async () => {
              for (let attempt = 0; attempt < 5; attempt++) {
                try {
                  await new Promise(resolve => setTimeout(resolve, 300 + (attempt * 200)));
                  if (videoRef.current) {
                    await videoRef.current.presentFullscreenPlayer();
                    setIsFullscreen(true);
                    console.log(`[FULLSCREEN] ✅ Entrou em tela cheia na tentativa ${attempt + 1}`);
                    return;
                  }
                } catch (e) {
                  if (attempt === 4) {
                    console.warn('[FULLSCREEN] ❌ Tela cheia não disponível após múltiplas tentativas:', e);
                    // Último recurso apenas para web
                    if (Platform.OS === 'web') {
                      try {
                        const container = document.getElementById('ultraiptv-player-root');
                        if (container) {
                          container.style.position = 'fixed';
                          container.style.top = '0';
                          container.style.left = '0';
                          container.style.width = '100vw';
                          container.style.height = '100vh';
                          container.style.zIndex = '9999';
                          setIsFullscreen(true);
                        }
                      } catch (styleError) {
                        console.warn('[FULLSCREEN] Fallback também falhou:', styleError);
                      }
                    }
                  }
                }
              }
            };
            await tryFullscreenMobile();
          } else {
            // Web - tentar múltiplos métodos com retry melhorado
            const tryFullscreen = async (retries = 3) => {
              for (let i = 0; i < retries; i++) {
                try {
                  await new Promise(resolve => setTimeout(resolve, 300 + (i * 200)));
                  
                  let el: any = null;
                  
                  // Tentar encontrar o container do player primeiro
                  const container = document.getElementById('ultraiptv-player-root');
                  if (container) {
                    el = container;
                  } else {
                    // Tentar encontrar o elemento video
                    const videoEl = document.querySelector('video');
                    if (videoEl) {
                      el = videoEl;
                    } else {
                      // Fallback para documentElement
                      el = document.documentElement;
                    }
                  }
                  
                  if (el) {
                    // Tentar todos os métodos de fullscreen
                    if (el.requestFullscreen) {
                      await el.requestFullscreen();
                      setIsFullscreen(true);
                      return;
                    } else if (el.webkitRequestFullscreen) {
                      await el.webkitRequestFullscreen();
                      setIsFullscreen(true);
                      return;
                    } else if (el.mozRequestFullScreen) {
                      await el.mozRequestFullScreen();
                      setIsFullscreen(true);
                      return;
                    } else if (el.msRequestFullscreen) {
                      await el.msRequestFullscreen();
                      setIsFullscreen(true);
                      return;
                    } else {
                      // Fallback: modo imersivo via CSS
                      if (el.style) {
                        el.style.position = 'fixed';
                        el.style.top = '0';
                        el.style.left = '0';
                        el.style.width = '100vw';
                        el.style.height = '100vh';
                        el.style.zIndex = '9999';
                        el.style.backgroundColor = '#000000';
                        setIsFullscreen(true);
                        return;
                      }
                    }
                  }
                } catch (e) {
                  if (i === retries - 1) {
                    console.warn('Fullscreen não disponível após tentativas:', e);
                    // Modo imersivo como último recurso
                    const el: any = document.getElementById('ultraiptv-player-root') || document.documentElement;
                    if (el && el.style) {
                      el.style.position = 'fixed';
                      el.style.top = '0';
                      el.style.left = '0';
                      el.style.width = '100vw';
                      el.style.height = '100vh';
                      el.style.zIndex = '9999';
                      el.style.backgroundColor = '#000000';
                      setIsFullscreen(true);
                    }
                  }
                }
              }
            };
            
            // Aguardar um pouco para garantir que o vídeo está carregado
            setTimeout(() => tryFullscreen(), 500);
          }
        } catch (error) {
          console.error('Erro ao carregar vídeo:', error);
          handlePlaybackError(error);
        } finally {
          setLoading(false);
        }
      }
      pingWatchdog();
    };
    loadVideo();
  }, [finalUri, savedProgress]);

  useEffect(() => {
    (async () => {
      try {
        if (finalUri) {
          await AsyncStorage.removeItem('@ultraiptv_playback');
        }
      } catch {}
    })();
  }, [finalUri]);

  const formatTime = (timeValue: number): string => {
    if (!timeValue || isNaN(timeValue) || timeValue < 0) return '00:00';
    
    // Se receber milissegundos (valor > 10000), converter para segundos
    let totalSeconds: number;
    if (timeValue > 10000) {
      // É milissegundos
      totalSeconds = Math.floor(timeValue / 1000);
    } else {
      // É segundos
      totalSeconds = Math.floor(timeValue);
    }
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    if (isLocked) return;
    pingWatchdog();
    showControlsWithTimeout();
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await videoRef.current.playAsync();
        setIsPlaying(true);
      }
    }
  };

  const handleBack = async () => {
    pingWatchdog();
    
    // Salvar progresso final antes de sair
    if (isVod && sid && currentTime > 0 && duration > 0) {
      try {
        const key = normalizedType === 'series' 
          ? `@ultraiptv_progress_series_${sid}`
          : `@ultraiptv_progress_movie_${sid}`;
        const progress = {
          position: currentTime,
          duration: duration,
          timestamp: Date.now(),
          title: title,
          type: normalizedType,
        };
        await AsyncStorage.setItem(key, JSON.stringify(progress));
      } catch (error) {
        console.warn('Erro ao salvar progresso final:', error);
      }
    }
    
    if (videoRef.current) {
      videoRef.current.unloadAsync();
    }
    try {
      AsyncStorage.removeItem('@ultraiptv_playback');
      if (typeof window !== 'undefined') window.sessionStorage.removeItem('ultraiptv_playback');
    } catch {}
    const origin = (from && ['live','movies','series'].includes(String(from)))
      ? String(from)
      : ((normalizedType === 'series') ? 'series' : (normalizedType === 'movie' || normalizedType === 'movies') ? 'movies' : (normalizedType === 'live') ? 'live' : null);
    if (origin) {
      router.replace(`/${origin}`);
    } else {
      router.back();
    }
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => sub.remove();
  }, [from]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const onPopState = () => {
        if (from && ['live','movies','series'].includes(String(from))) {
          router.replace(`/${String(from)}`);
        }
      };
      window.addEventListener('popstate', onPopState);
      return () => window.removeEventListener('popstate', onPopState);
    }
  }, [from]);

  const adjustVolume = async (delta: number) => {
    if (!videoRef.current) return;
    try {
      const next = Math.min(1, Math.max(0, volume + delta));
      await videoRef.current.setVolumeAsync(next);
      setVolume(next);
    } catch {}
  };

  const toggleFullscreen = async () => {
    if (isLocked) return;
    showControlsWithTimeout();
    try {
      if (Platform.OS === 'web') {
        const isCurrentlyFullscreen = !!(document.fullscreenElement || 
          (document as any).webkitFullscreenElement || 
          (document as any).mozFullScreenElement || 
          (document as any).msFullscreenElement);
        
        if (isCurrentlyFullscreen) {
          // Sair do fullscreen
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if ((document as any).webkitExitFullscreen) {
            await (document as any).webkitExitFullscreen();
          } else if ((document as any).mozCancelFullScreen) {
            await (document as any).mozCancelFullScreen();
          } else if ((document as any).msExitFullscreen) {
            await (document as any).msExitFullscreen();
          }
          setIsFullscreen(false);
        } else {
          // Entrar no fullscreen - tentar múltiplos elementos
          let el: any = null;
          
          // Tentar encontrar o container do player
          const container = document.getElementById('ultraiptv-player-root');
          if (container) {
            el = container;
          } else {
            // Tentar encontrar o elemento video
            const videoEl = document.querySelector('video');
            if (videoEl) {
              el = videoEl;
            } else {
              // Fallback para documentElement
              el = document.documentElement;
            }
          }
          
          if (el) {
            // Tentar todos os métodos de fullscreen
            if (el.requestFullscreen) {
              await el.requestFullscreen();
              setIsFullscreen(true);
            } else if (el.webkitRequestFullscreen) {
              await el.webkitRequestFullscreen();
              setIsFullscreen(true);
            } else if (el.mozRequestFullScreen) {
              await el.mozRequestFullScreen();
              setIsFullscreen(true);
            } else if (el.msRequestFullscreen) {
              await el.msRequestFullscreen();
              setIsFullscreen(true);
            } else {
              // Fallback: modo imersivo via CSS
              if (el.style) {
                el.style.position = 'fixed';
                el.style.top = '0';
                el.style.left = '0';
                el.style.width = '100vw';
                el.style.height = '100vh';
                el.style.zIndex = '9999';
                el.style.backgroundColor = '#000000';
          setIsFullscreen(true);
              }
            }
          }
        }
      } else {
        if (isFullscreen) {
          try {
            await videoRef.current?.dismissFullscreenPlayer?.();
            setIsFullscreen(false);
          } catch (e) {
            console.warn('Erro ao sair do fullscreen:', e);
            setIsFullscreen(false);
          }
        } else {
          try {
            // Tentar múltiplas vezes se necessário
            for (let attempt = 0; attempt < 3; attempt++) {
              try {
                await new Promise(resolve => setTimeout(resolve, 200 + (attempt * 300)));
                if (videoRef.current) {
                  await videoRef.current.presentFullscreenPlayer();
                  setIsFullscreen(true);
                  break;
                }
              } catch (e) {
                if (attempt === 2) {
                  console.warn('Erro ao entrar em fullscreen após múltiplas tentativas:', e);
                }
              }
            }
          } catch (e) {
            console.warn('Erro ao entrar em fullscreen:', e);
          }
        }
      }
    } catch (error) {
      console.warn('Erro ao alternar fullscreen:', error);
      // Tentar fallback imersivo em caso de erro
      if (Platform.OS === 'web') {
        try {
          const el: any = document.getElementById('ultraiptv-player-root') || document.documentElement;
          if (el && el.style) {
            el.style.position = 'fixed';
            el.style.top = '0';
            el.style.left = '0';
            el.style.width = '100vw';
            el.style.height = '100vh';
            el.style.zIndex = '9999';
            el.style.backgroundColor = '#000000';
            setIsFullscreen(true);
          }
        } catch (e) {
          console.warn('Fallback fullscreen também falhou:', e);
        }
      }
    }
  };

  const setPlayerPosition = useCallback(async (seconds: number) => {
    const ms = Math.round(seconds * 1000);
    // Primeiro: tentar com API do componente (Expo AV)
    if (videoRef.current && typeof videoRef.current.setPositionAsync === 'function') {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          if (attempt > 0) await new Promise(resolve => setTimeout(resolve, 100 * attempt));
          await videoRef.current.setPositionAsync(ms);
          setCurrentTime(seconds);
          console.log('[SEEK] ✅ Posição atualizada via setPositionAsync:', seconds, 's - tentativa', attempt + 1);
          return true;
        } catch (seekError: any) {
          console.warn(`[SEEK] ⚠️ setPositionAsync tentativa ${attempt + 1} falhou:`, seekError?.message || seekError);
        }
      }
    }

    // Fallback web: manipular o elemento <video> diretamente
    if (Platform.OS === 'web') {
      try {
        const el: any = document.getElementById('ultraiptv-player-root') || document.documentElement;
        const videoEl: HTMLVideoElement | null = el?.querySelector?.('video') ?? null;
        if (videoEl) {
          const wasPlaying = !videoEl.paused;
          videoEl.currentTime = seconds;
          // tentar manter o estado de reprodução
          if (wasPlaying) videoEl.play().catch(() => {});
          setCurrentTime(seconds);
          console.log('[SEEK] ✅ Posição atualizada via DOM <video> fallback:', seconds, 's');
          return true;
        }
      } catch (err) {
        console.warn('[SEEK] ⚠️ Falha no fallback DOM video:', err);
      }
    }

    // Não conseguiu
    return false;
  }, [videoRef, setCurrentTime]);

  const handleSeekToPosition = useCallback(async (position: number) => {
    console.log('[SEEK] ===== INÍCIO handleSeekToPosition =====');
    console.log('[SEEK] Parâmetros:', { position, isLocked, isVod, duration, currentTime, hasRef: !!videoRef.current });
    
    if (isLocked) {
      console.warn('[SEEK] ❌ Bloqueado: controles travados');
      return;
    }
    
    if (!videoRef.current) {
      console.warn('[SEEK] ❌ Bloqueado: videoRef não disponível');
      return;
    }
    
    showControlsWithTimeout();
    setIsSeeking(true);
    
    try {
      const currentStatus = await videoRef.current.getStatusAsync();
      if (!currentStatus || !currentStatus.isLoaded) {
        console.warn('[SEEK] ❌ Vídeo não está carregado, aguardando...');
        // Aguardar um pouco e tentar novamente
        await new Promise(resolve => setTimeout(resolve, 300));
        const retryStatus = await videoRef.current.getStatusAsync();
        if (!retryStatus || !retryStatus.isLoaded) {
          console.warn('[SEEK] ❌ Vídeo ainda não carregado após retry');
          setIsSeeking(false);
          return;
        }
      }
      
      // Obter status atualizado após o retry se necessário
      let finalStatus = currentStatus;
      if (!currentStatus.isLoaded) {
        finalStatus = await videoRef.current.getStatusAsync();
      }
      
      // Tentar obter duração do status se não estiver disponível
      let effectiveDuration = duration;
      if (finalStatus.isLoaded && effectiveDuration <= 0 && (finalStatus as any).durationMillis && (finalStatus as any).durationMillis > 0) {
        effectiveDuration = (finalStatus as any).durationMillis / 1000;
        console.log('[SEEK] ✅ Duração obtida do status:', effectiveDuration, 'segundos');
        setDuration(effectiveDuration);
      }
      
      let target: number;
      if (isVod) {
        if (effectiveDuration > 0) {
          target = Math.min(Math.max(position, 0), effectiveDuration);
        } else {
          // VOD sem duração ainda - permitir seek para a posição solicitada (será validado pelo player)
          target = Math.max(position, 0);
          console.log('[SEEK] ⚠️ VOD sem duração, usando posição solicitada:', target);
        }
      } else {
        // Para live, usar posição relativa ao tempo atual
        const currentPos = finalStatus.isLoaded && (finalStatus as any).positionMillis ? (finalStatus as any).positionMillis / 1000 : currentTime;
        target = Math.max(position, currentPos - 30); // Limitar a 30s de buffer
      }
      
      console.log('[SEEK] 🎯 Buscando posição:', target, 'segundos (isVod:', isVod, 'duration:', effectiveDuration, ')');
      
      // Tentar setar posição (usa helper com fallback)
      const ok = await setPlayerPosition(target);
      if (!ok) {
        console.warn('[SEEK] ⚠️ Não foi possível buscar via API nem via DOM; atualizando visualmente apenas');
        setCurrentTime(target);
      }
      
      // Manter o estado de play/pause
      let finalStatusForPlay = currentStatus;
      if (!currentStatus.isLoaded) {
        finalStatusForPlay = await videoRef.current.getStatusAsync();
      }
      if (finalStatusForPlay.isLoaded) {
        if (!isPlaying && (finalStatusForPlay as any).isPlaying) {
          await videoRef.current.pauseAsync();
        } else if (isPlaying && !(finalStatusForPlay as any).isPlaying) {
          await videoRef.current.playAsync();
        }
      }
    } catch (error) {
      console.error('[SEEK] ❌ Erro ao buscar posição do vídeo:', error);
    } finally {
      setTimeout(() => {
        setIsSeeking(false);
        console.log('[SEEK] ===== FIM handleSeekToPosition =====');
      }, 200);
    }
  }, [isLocked, duration, isVod, isPlaying, showControlsWithTimeout, currentTime, setPlayerPosition]);

  // Helpers para handlers pointer/mouse/web
  const getPointerXRelative = (e: any) => {
    try {
      if (Platform.OS === 'web') {
        const clientX = e.clientX ?? e.nativeEvent?.clientX ?? e.nativeEvent?.pageX;
        const rect = (progressBarRef.current as any)?.getBoundingClientRect?.();
        if (typeof clientX === 'number' && rect) return clientX - rect.left;
        // fallback: try locationX
        return e.nativeEvent?.locationX ?? 0;
      }
      return e.nativeEvent?.locationX ?? 0;
    } catch (err) {
      return e.nativeEvent?.locationX ?? 0;
    }
  };

  

  const handleProgressResponderGrant = (e: any) => {
    console.log('[SEEK] handler grant');
    console.log('[SEEK] grant params:', { isVod, duration, progressBarLayoutWidth: progressBarLayout.width, width });
    if (isLocked) return;
    try {
      const progressBarWidth = progressBarLayout.width || (width - 200);
      if (progressBarWidth > 0) {
        const touchX = getPointerXRelative(e);
        const percentage = Math.max(0, Math.min(1, touchX / progressBarWidth));
        if (isVod && duration > 0) {
          const targetPosition = percentage * duration;
          console.log('[SEEK] Responder grant - posição inicial:', targetPosition);
          setCurrentTime(targetPosition);
          setIsSeeking(true);
          showControlsWithTimeout();
        }
      }
    } catch (err) { console.warn('[SEEK] onResponderGrant erro', err); }
  };

  const handleProgressResponderMove = (e: any) => {
    if (isLocked) return;
    console.log('[SEEK] move params:', { isVod, duration, currentTime });
    try {
      const progressBarWidth = progressBarLayout.width || (width - 200);
      if (progressBarWidth > 0) {
        const touchX = getPointerXRelative(e);
        const percentage = Math.max(0, Math.min(1, touchX / progressBarWidth));
        const effectiveDuration = duration > 0 ? duration : Math.max(currentTime * 2, 3600);
        if (isVod) {
          const target = percentage * effectiveDuration;
          setCurrentTime(target);
        }
      }
    } catch (err) { console.warn('[SEEK] onResponderMove erro', err); }
  };

  const handleProgressResponderRelease = (e: any) => {
    console.log('[SEEK] handler release');
    console.log('[SEEK] release params:', { isVod, duration, currentTime });
    if (isLocked) { setIsSeeking(false); return; }
    try {
      const progressBarWidth = progressBarLayout.width || (width - 200);
      if (progressBarWidth > 0) {
        const touchX = getPointerXRelative(e);
        const percentage = Math.max(0, Math.min(1, touchX / progressBarWidth));
        if (isVod) {
          const finalDuration = duration > 0 ? duration : Math.max(currentTime * 2, 3600);
          const targetPosition = percentage * finalDuration;
          console.log('[SEEK] Responder release - seek para', targetPosition);
          handleSeekToPosition(targetPosition);
        } else {
          setIsSeeking(false);
        }
      } else {
        setIsSeeking(false);
      }
    } catch (err) { console.warn('[SEEK] onResponderRelease erro', err); setIsSeeking(false); }
  };

  // pointer/mouse handlers delegate to the same logic
  const handleProgressPointerDown = (e: any) => {
    // normalize event for web where e is a MouseEvent
    const ev = e.nativeEvent ? e : e;
    try { isPointerActiveRef.current = true; } catch (err) {}
    handleProgressResponderGrant(ev);
  };

  const handleProgressPointerMove = (e: any) => {
    const ev = e.nativeEvent ? e : e;
    // evitar update por hover: só processar quando o ponteiro estiver ativo (pressionado) ou quando há buttons
    try {
      const buttons = (ev as any)?.buttons ?? (ev as any)?.nativeEvent?.buttons ?? 0;
      if (!isPointerActiveRef.current && !buttons) {
        // Ignorar hover (apenas log curto para debugging)
        // console.log('[SEEK] Ignorando pointer move por hover', { buttons });
        return;
      }
    } catch (err) {}
    handleProgressResponderMove(ev);
  };

  const handleProgressPointerUp = (e: any) => {
    const ev = e.nativeEvent ? e : e;
    try { isPointerActiveRef.current = false; } catch (err) {}
    handleProgressResponderRelease(ev);
  };

  // Attach DOM pointer/mouse listeners directly for more reliable web interaction
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    // localiza e usa o ref global isPointerActiveRef para controlar estado do ponteiro
    const node: any = (progressBarRef.current as any) || null;
    if (!node || typeof node.addEventListener !== 'function') return;

    const onPointerDown = (ev: PointerEvent) => {
      try {
        isPointerActiveRef.current = true;
        // normalize to similar shape used in responder handlers
        handleProgressPointerDown(ev as any);
        console.log('[SEEK] onPointerDown event:', { pointerId: (ev as any)?.pointerId, clientX: (ev as any)?.clientX });
        // capture pointer to continue receiving move/up
        // @ts-ignore
        if (ev.pointerId && node.setPointerCapture) node.setPointerCapture(ev.pointerId);
      } catch (err) {
        console.warn('[SEEK] onPointerDown listener error', err);
      }
    };

    const onPointerMove = (ev: PointerEvent) => {
      try {
        // ignorar movimentos quando não há botão pressionado (evita hover causing updates)
        if (!isPointerActiveRef.current && !(ev as any)?.buttons) return;
        handleProgressPointerMove(ev as any);
      } catch (err) {
        // no-op
      }
    };

    const onPointerUp = (ev: PointerEvent) => {
      try {
        handleProgressPointerUp(ev as any);
        isPointerActiveRef.current = false;
        // @ts-ignore
        if (ev.pointerId && node.releasePointerCapture) node.releasePointerCapture(ev.pointerId);
      } catch (err) {
        // no-op
      }
    };

    // Mouse fallback
    const onMouseDown = (ev: MouseEvent) => { try { isPointerActiveRef.current = true; } catch (e) {} ; onPointerDown(ev as any); };
    const onMouseDownLog = (ev: MouseEvent) => console.log('[SEEK] onMouseDown event:', { clientX: (ev as any)?.clientX });
    const onMouseMove = (ev: MouseEvent) => { try { if (!isPointerActiveRef.current && !(ev as any)?.buttons) return; } catch (e) {} ; onPointerMove(ev as any); };
    const onMouseUp = (ev: MouseEvent) => { try { isPointerActiveRef.current = false; } catch (e) {} ; onPointerUp(ev as any); };

    node.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    node.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      try {
        node.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);

        node.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      } catch (e) {}
    };
  }, [progressBarRef, progressBarLayout.width, isVod, duration, currentTime]);

  // PanResponder para arrastar na barra de progresso
  const progressPanResponder = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => {
        // Não capturar no início para não interferir com o Pressable
        return false;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Só capturar se houver movimento significativo (arrastar)
        // SEMPRE permitir seek se não estiver travado (removida restrição de duração)
        const canSeek = !isLocked;
        const hasMovement = Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
        console.log('[SEEK] onMoveShouldSetPanResponder:', { canSeek, hasMovement, dx: gestureState.dx, dy: gestureState.dy, isVod, duration });
        return canSeek && hasMovement;
      },
      onPanResponderGrant: async (evt) => {
        if (isLocked) return;
        
        setIsSeeking(true);
        showControlsWithTimeout();
        
        // Tentar obter duração do status se não estiver disponível
        let effectiveDuration = duration;
        if (effectiveDuration <= 0 && videoRef.current) {
          try {
            const status = await videoRef.current.getStatusAsync();
            if (status.isLoaded && status.durationMillis && status.durationMillis > 0) {
              effectiveDuration = status.durationMillis / 1000;
              setDuration(effectiveDuration);
              console.log('[SEEK] ✅ Duração obtida do status no arraste:', effectiveDuration);
            }
          } catch (e) {
            console.warn('[SEEK] Erro ao obter duração:', e);
          }
        }
        
        // Calcular posição inicial no toque
        const progressBarWidth = progressBarLayout.width || (width - 200);
        if (progressBarWidth > 0) {
          const touchX = evt.nativeEvent.locationX;
          let targetPosition = 0;
          
          if (isVod && effectiveDuration > 0) {
            const percentage = Math.max(0, Math.min(1, touchX / progressBarWidth));
            targetPosition = percentage * effectiveDuration;
          } else if (isVod) {
            // VOD sem duração - usar posição relativa ao tempo atual
            const percentage = Math.max(0, Math.min(1, touchX / progressBarWidth));
            // Estimar duração baseado na posição atual (assumir pelo menos 1 hora)
            const estimatedDuration = Math.max(currentTime * 2, 3600);
            targetPosition = percentage * estimatedDuration;
          } else {
            // Para live, usar posição relativa
            targetPosition = currentTime;
          }
          
          console.log('[SEEK] Início do arraste na barra:', targetPosition, 'segundos (duration:', effectiveDuration, ')');
          setCurrentTime(targetPosition);
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (isLocked) return;
        
        const progressBarWidth = progressBarLayout.width || (width - 200);
        if (progressBarWidth > 0) {
          const touchX = evt.nativeEvent.locationX + gestureState.dx;
          const percentage = Math.max(0, Math.min(1, touchX / progressBarWidth));
          
          // Usar duração atual ou estimar se não tiver
          const effectiveDuration = duration > 0 ? duration : Math.max(currentTime * 2, 3600);
          
          if (isVod) {
            const targetPosition = percentage * effectiveDuration;
            setCurrentTime(targetPosition);
          } else {
            // Para live, atualizar visualmente
            setCurrentTime(currentTime);
          }
        }
      },
      onPanResponderRelease: async (evt, gestureState) => {
        if (isLocked) {
          setIsSeeking(false);
          return;
        }
        
        // Tentar obter duração do status se não estiver disponível
        let effectiveDuration = duration;
        if (effectiveDuration <= 0 && videoRef.current) {
          try {
            const status = await videoRef.current.getStatusAsync();
            if (status.isLoaded && status.durationMillis && status.durationMillis > 0) {
              effectiveDuration = status.durationMillis / 1000;
              setDuration(effectiveDuration);
              console.log('[SEEK] ✅ Duração obtida do status no release:', effectiveDuration);
            }
          } catch (e) {
            console.warn('[SEEK] Erro ao obter duração:', e);
          }
        }
        
        const progressBarWidth = progressBarLayout.width || (width - 200);
        if (progressBarWidth > 0) {
          // Usar a posição final do gesto (locationX + dx)
          const touchX = evt.nativeEvent.locationX + (gestureState.dx || 0);
          const percentage = Math.max(0, Math.min(1, touchX / progressBarWidth));
          
          if (isVod) {
            // Se não tiver duração, estimar
            const finalDuration = effectiveDuration > 0 ? effectiveDuration : Math.max(currentTime * 2, 3600);
            const targetPosition = percentage * finalDuration;
            console.log('[SEEK] Fim do arraste na posição:', targetPosition, 'segundos (duration:', finalDuration, ')');
            handleSeekToPosition(targetPosition);
          } else {
            // Para live, tentar seek relativo
            console.log('[SEEK] Live stream - tentando seek relativo');
            setIsSeeking(false);
          }
        } else {
          setIsSeeking(false);
        }
      },
      onPanResponderTerminate: () => {
        setIsSeeking(false);
      },
    }),
    [isLocked, duration, isVod, progressBarLayout.width, showControlsWithTimeout, width, handleSeekToPosition, currentTime]
  );

  const handleSeek = useCallback(async (deltaSeconds: number) => {
    console.log('[SEEK] ===== INÍCIO handleSeek =====');
    console.log('[SEEK] Parâmetros:', { deltaSeconds, isLocked, isVod, duration, currentTime, hasRef: !!videoRef.current });
    
    if (isLocked) {
      console.log('[SEEK] ❌ Bloqueado: controles travados');
      return;
    }
    
    if (!videoRef.current) {
      console.log('[SEEK] ❌ Bloqueado: videoRef não disponível');
      return;
    }
    
    pingWatchdog();
    showControlsWithTimeout();
    
    try {
      let currentStatus = await videoRef.current.getStatusAsync();
      if (!currentStatus || !currentStatus.isLoaded) {
        console.warn('[SEEK] ❌ Vídeo não está carregado, aguardando...');
        // Aguardar um pouco e tentar novamente
        await new Promise(resolve => setTimeout(resolve, 300));
        currentStatus = await videoRef.current.getStatusAsync();
        if (!currentStatus || !currentStatus.isLoaded) {
          console.warn('[SEEK] ❌ Vídeo ainda não carregado após retry');
          return;
        }
      }
      
      // Obter tempo atual do status (sempre usar do status, não do state)
      const currentPos = currentStatus.positionMillis ? currentStatus.positionMillis / 1000 : currentTime;
      
      // Tentar obter duração do status se não estiver disponível
      let effectiveDuration = duration;
      if (effectiveDuration <= 0 && currentStatus.durationMillis && currentStatus.durationMillis > 0) {
        effectiveDuration = currentStatus.durationMillis / 1000;
        console.log('[SEEK] ✅ Duração obtida do status:', effectiveDuration, 'segundos');
        setDuration(effectiveDuration);
      }
      
      // Calcular posição alvo - SEMPRE permitir seek, mesmo sem duração
      let targetSeconds: number;
      if (isVod) {
        if (effectiveDuration > 0) {
          targetSeconds = Math.min(Math.max(currentPos + deltaSeconds, 0), effectiveDuration);
        } else {
          // VOD sem duração ainda - permitir seek relativo
          targetSeconds = Math.max(currentPos + deltaSeconds, 0);
          console.log('[SEEK] ⚠️ VOD sem duração, usando seek relativo:', targetSeconds);
        }
      } else {
        // Para live, tentar seek relativo (pode funcionar se houver buffer)
        targetSeconds = Math.max(currentPos + deltaSeconds, 0);
        // Limitar a 30 segundos de buffer para live streams
        if (targetSeconds > currentPos + 30) {
          targetSeconds = currentPos;
        }
      }
      
      console.log(`[SEEK] 🎯 Retrocedendo/Avançando: ${currentPos.toFixed(1)}s -> ${targetSeconds.toFixed(1)}s (delta: ${deltaSeconds}s, duration: ${effectiveDuration}s)`);
      
      setIsSeeking(true);
      const ok = await setPlayerPosition(targetSeconds);
      if (!ok) {
        console.warn('[SEEK] ⚠️ Não foi possível buscar via API nem via DOM; atualizando visualmente apenas');
        setCurrentTime(targetSeconds);
      }
      
      // Manter o estado de play/pause
      if (isPlaying && !currentStatus.isPlaying) {
        await videoRef.current.playAsync();
      } else if (!isPlaying && currentStatus.isPlaying) {
        await videoRef.current.pauseAsync();
      }
      
      setTimeout(() => {
        setIsSeeking(false);
        console.log('[SEEK] ===== FIM handleSeek =====');
      }, 200);
    } catch (error) {
      console.error('[SEEK] ❌ Erro ao buscar posição do vídeo:', error);
      setIsSeeking(false);
    }
  }, [isLocked, isVod, duration, currentTime, isPlaying, showControlsWithTimeout, setPlayerPosition]);

  const handleToggleMute = async () => {
    if (!videoRef.current) return;
    showControlsWithTimeout();
    const next = !isMuted;
    await videoRef.current.setIsMutedAsync(next);
    setIsMuted(next);
  };

  const handleCycleSpeed = async () => {
    if (!videoRef.current || isLocked) return;
    showControlsWithTimeout();
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const next = speeds[nextIndex];
    await videoRef.current.setRateAsync(next, true);
    setPlaybackRate(next);
    setPlaybackSpeed(next);
  };

  const attemptReload = async () => {
    try {
      setLoading(true);
      if (!videoRef.current) return;
      await videoRef.current.unloadAsync();
      await new Promise((r) => setTimeout(r, 500 * (retryCount + 1)));
      await videoRef.current.loadAsync({ uri: finalUri as string }, { shouldPlay: true });
      setRetryCount((c) => c + 1);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // Atualizar tempo periodicamente para garantir que a barra de progresso funcione
  useEffect(() => {
    if (!isPlaying || isSeeking) return;
    
    const interval = setInterval(async () => {
      try {
        if (!videoRef.current || isSeeking) return;
        const status: any = await videoRef.current.getStatusAsync();
        if (status?.isLoaded && status.positionMillis !== undefined && !isSeeking) {
          const posSeconds = status.positionMillis / 1000;
          // Só atualizar se a diferença for significativa
          if (Math.abs(posSeconds - currentTime) > 0.1) {
            setCurrentTime(posSeconds);
          }
          // Sempre tentar atualizar duração se disponível (importante para VOD)
          if (status.durationMillis && status.durationMillis > 0) {
            const durSeconds = status.durationMillis / 1000;
            // Atualizar duração se mudou significativamente ou se ainda não foi definida
            if (duration <= 0 || Math.abs(durSeconds - duration) > 1) {
              console.log('[PLAYER] Duração atualizada:', durSeconds, 'segundos');
              setDuration(durSeconds);
            }
          }
        }
      } catch (error) {
        // Ignorar erros silenciosamente
      }
    }, 500); // Atualizar a cada 500ms para melhor responsividade
    
    return () => clearInterval(interval);
  }, [isPlaying, isSeeking, duration, currentTime]);

  // Sistema anti-travamento robusto para TV ao vivo e VOD
  useEffect(() => {
    let lastPos = -1;
    let stuckTicks = 0;
    let consecutiveErrors = 0;
    let lastErrorTime = 0;
    let reloadAttempts = 0;
    const MAX_RELOAD_ATTEMPTS = 5;
    
    const interval = setInterval(async () => {
      try {
        if (!videoRef.current) return;
        const s: any = await videoRef.current.getStatusAsync();
        if (!s || !s.isLoaded) {
          // Se não está carregado e deveria estar, tentar recarregar
          if (isPlaying && Date.now() - lastErrorTime > 5000) {
            console.warn('[ANTI-TRAVAMENTO] Vídeo não carregado, tentando recarregar...');
            lastErrorTime = Date.now();
            consecutiveErrors++;
            if (consecutiveErrors < 3) {
              await attemptReload();
            }
          }
          return;
        }
        
        const pos = s.positionMillis || 0;
        const isBuffering = !!s.isBuffering;
        const playing = !!s.isPlaying;
        const hasError = !!(s as any).error;
        
        // Reset contadores se está funcionando
        if (playing && !isBuffering && !hasError && pos !== lastPos) {
          stuckTicks = 0;
          consecutiveErrors = 0;
          reloadAttempts = 0;
        }
        
        // Detectar travamento por posição congelada
        if (playing && !isBuffering) {
          if (pos === lastPos && lastPos >= 0) {
            stuckTicks += 1;
            console.log(`[ANTI-TRAVAMENTO] Posição congelada detectada (${stuckTicks} ticks)`);
          } else {
            stuckTicks = 0;
          }
          lastPos = pos;
          
          // Para TV ao vivo: mais agressivo (2 ticks = 4 segundos)
          // Para VOD: menos agressivo (3 ticks = 6 segundos)
          const threshold = normalizedType === 'live' ? 2 : 3;
          
          if (stuckTicks >= threshold && reloadAttempts < MAX_RELOAD_ATTEMPTS) {
            console.warn(`[ANTI-TRAVAMENTO] ⚠️ Travamento detectado! Tentando recuperar... (tentativa ${reloadAttempts + 1}/${MAX_RELOAD_ATTEMPTS})`);
            reloadAttempts++;
            
            try {
              // Para VOD, tentar seek primeiro
              if (isVod && duration > 0 && currentTime > 0 && videoRef.current) {
                try {
                  const currentStatus = await videoRef.current.getStatusAsync();
                  if (currentStatus.isLoaded && currentStatus.positionMillis) {
                    const currentPos = currentStatus.positionMillis / 1000;
                    const targetPos = Math.min(currentPos + 1, duration);
                    const ok = await setPlayerPosition(targetPos);
                    if (!ok) console.warn('[ANTI-TRAVAMENTO] Seek via API/DOM falhou no recovery');
                    await new Promise(resolve => setTimeout(resolve, 500));
                  }
                } catch (seekError) {
                  console.warn('[ANTI-TRAVAMENTO] Seek falhou, tentando reload');
                }
              }
              
              // Recarregar o stream
              await attemptReload();
              stuckTicks = 0;
              
              // Aguardar antes de verificar novamente
              await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (reloadError) {
              console.error('[ANTI-TRAVAMENTO] Erro ao tentar recuperar:', reloadError);
              // Se falhou muitas vezes, resetar contadores para evitar loop infinito
              if (reloadAttempts >= MAX_RELOAD_ATTEMPTS) {
                console.error('[ANTI-TRAVAMENTO] ❌ Máximo de tentativas atingido. Stream pode estar indisponível.');
                stuckTicks = 0;
                reloadAttempts = 0;
                // Mostrar alerta ao usuário
                Alert.alert(
                  'Problema de reprodução',
                  'O stream está travando. Tente trocar de canal ou verificar sua conexão.',
                  [{ text: 'OK' }]
                );
              }
            }
          }
        }
        
        // Detectar erros de reprodução
        if (hasError) {
          consecutiveErrors++;
          lastErrorTime = Date.now();
          console.warn(`[ANTI-TRAVAMENTO] Erro detectado (${consecutiveErrors} consecutivos)`);
          
          if (consecutiveErrors >= 2 && reloadAttempts < MAX_RELOAD_ATTEMPTS) {
            console.warn('[ANTI-TRAVAMENTO] Múltiplos erros, tentando recarregar...');
            reloadAttempts++;
            await attemptReload();
            consecutiveErrors = 0;
          }
        }
        
        // Detectar buffering prolongado (mais de 10 segundos)
        if (isBuffering && playing) {
          const bufferingStart = (s as any).bufferingStartTime || Date.now();
          const bufferingDuration = Date.now() - bufferingStart;
          
          if (bufferingDuration > 10000 && reloadAttempts < MAX_RELOAD_ATTEMPTS) {
            console.warn('[ANTI-TRAVAMENTO] Buffering prolongado detectado, tentando recarregar...');
            reloadAttempts++;
            await attemptReload();
          }
        }
      } catch (error) {
        console.error('[ANTI-TRAVAMENTO] Erro no monitoramento:', error);
      }
    }, 2000); // Verificar a cada 2 segundos
    
    return () => clearInterval(interval);
  }, [finalUri, isVod, normalizedType, isPlaying, currentTime, duration, attemptReload, setPlayerPosition]);

  const goNextEpisode = async () => {
    try {
      let raw = null;
      if (typeof window !== 'undefined') {
        raw = window.sessionStorage.getItem('ultraiptv_series_playlist');
      }
      if (!raw) {
        raw = await AsyncStorage.getItem('@ultraiptv_series_playlist');
      }
      
      if (!raw) {
        Alert.alert('Aviso', 'Playlist de episódios não encontrada.');
        return;
      }
      
      const store = JSON.parse(raw);
      if (!store || !Array.isArray(store.items) || store.items.length === 0) {
        Alert.alert('Aviso', 'Nenhum episódio disponível.');
        return;
      }
      
      const currentIdx = store.index ?? 0;
      const idx = currentIdx + 1;
      
      if (idx >= store.items.length) {
        Alert.alert('Aviso', 'Este é o último episódio.');
        return;
      }
      
      store.index = idx;
      const next = store.items[idx];
      
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('ultraiptv_series_playlist', JSON.stringify(store));
      }
      await AsyncStorage.setItem('@ultraiptv_series_playlist', JSON.stringify(store));
      await AsyncStorage.setItem('@ultraiptv_playback', JSON.stringify({ uri: next.uri, title: next.title, type: 'series', sid: next.sid, ext: next.ext }));
      
      const url = `/player?uri=${encodeURIComponent(next.uri)}&title=${encodeURIComponent(next.title)}&type=series&sid=${encodeURIComponent(next.sid)}&ext=${encodeURIComponent(next.ext)}&from=series`;
      router.replace(url);
    } catch (error: any) {
      console.error('Erro ao navegar para próximo episódio:', error);
      Alert.alert('Erro', `Não foi possível navegar: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const goPrevEpisode = async () => {
    try {
      let raw = null;
      if (typeof window !== 'undefined') {
        raw = window.sessionStorage.getItem('ultraiptv_series_playlist');
      }
      if (!raw) {
        raw = await AsyncStorage.getItem('@ultraiptv_series_playlist');
      }
      
      if (!raw) {
        Alert.alert('Aviso', 'Playlist de episódios não encontrada.');
        return;
      }
      
      const store = JSON.parse(raw);
      if (!store || !Array.isArray(store.items) || store.items.length === 0) {
        Alert.alert('Aviso', 'Nenhum episódio disponível.');
        return;
      }
      
      const currentIdx = store.index ?? 0;
      const idx = Math.max(currentIdx - 1, 0);
      
      if (idx === currentIdx && idx === 0) {
        Alert.alert('Aviso', 'Este é o primeiro episódio.');
        return;
      }
      
      store.index = idx;
      const prev = store.items[idx];
      
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('ultraiptv_series_playlist', JSON.stringify(store));
      }
      await AsyncStorage.setItem('@ultraiptv_series_playlist', JSON.stringify(store));
      await AsyncStorage.setItem('@ultraiptv_playback', JSON.stringify({ uri: prev.uri, title: prev.title, type: 'series', sid: prev.sid, ext: prev.ext }));
      
      const url = `/player?uri=${encodeURIComponent(prev.uri)}&title=${encodeURIComponent(prev.title)}&type=series&sid=${encodeURIComponent(prev.sid)}&ext=${encodeURIComponent(prev.ext)}&from=series`;
      router.replace(url);
    } catch (error: any) {
      console.error('Erro ao navegar para episódio anterior:', error);
      Alert.alert('Erro', `Não foi possível navegar: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const goNextMovie = async () => {
    try {
      let raw = null;
      if (typeof window !== 'undefined') {
        raw = window.sessionStorage.getItem('ultraiptv_movies_playlist');
      }
      if (!raw) {
        raw = await AsyncStorage.getItem('@ultraiptv_movies_playlist');
      }
      
      if (!raw) {
        Alert.alert('Aviso', 'Playlist de filmes não encontrada.');
        return;
      }
      
      const store = JSON.parse(raw);
      if (!store || !Array.isArray(store.items) || store.items.length === 0) {
        Alert.alert('Aviso', 'Nenhum filme disponível.');
        return;
      }
      
      const currentIdx = store.index ?? 0;
      const idx = currentIdx + 1;
      
      if (idx >= store.items.length) {
        Alert.alert('Aviso', 'Este é o último filme.');
        return;
      }
      
      store.index = idx;
      const next = store.items[idx];
      
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('ultraiptv_movies_playlist', JSON.stringify(store));
      }
      await AsyncStorage.setItem('@ultraiptv_movies_playlist', JSON.stringify(store));
      await AsyncStorage.setItem('@ultraiptv_playback', JSON.stringify({ uri: next.uri, title: next.title, type: 'movie', sid: next.sid, ext: next.ext }));
      
      const url = `/player?uri=${encodeURIComponent(next.uri)}&title=${encodeURIComponent(next.title)}&type=movie&sid=${encodeURIComponent(next.sid)}&ext=${encodeURIComponent(next.ext)}&from=movies`;
      router.replace(url);
    } catch (error: any) {
      console.error('Erro ao navegar para próximo filme:', error);
      Alert.alert('Erro', `Não foi possível navegar: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const goPrevMovie = async () => {
    try {
      let raw = null;
      if (typeof window !== 'undefined') {
        raw = window.sessionStorage.getItem('ultraiptv_movies_playlist');
      }
      if (!raw) {
        raw = await AsyncStorage.getItem('@ultraiptv_movies_playlist');
      }
      
      if (!raw) {
        Alert.alert('Aviso', 'Playlist de filmes não encontrada.');
        return;
      }
      
      const store = JSON.parse(raw);
      if (!store || !Array.isArray(store.items) || store.items.length === 0) {
        Alert.alert('Aviso', 'Nenhum filme disponível.');
        return;
      }
      
      const currentIdx = store.index ?? 0;
      const idx = Math.max(currentIdx - 1, 0);
      
      if (idx === currentIdx && idx === 0) {
        Alert.alert('Aviso', 'Este é o primeiro filme.');
        return;
      }
      
      store.index = idx;
      const prev = store.items[idx];
      
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('ultraiptv_movies_playlist', JSON.stringify(store));
      }
      await AsyncStorage.setItem('@ultraiptv_movies_playlist', JSON.stringify(store));
      await AsyncStorage.setItem('@ultraiptv_playback', JSON.stringify({ uri: prev.uri, title: prev.title, type: 'movie', sid: prev.sid, ext: prev.ext }));
      
      const url = `/player?uri=${encodeURIComponent(prev.uri)}&title=${encodeURIComponent(prev.title)}&type=movie&sid=${encodeURIComponent(prev.sid)}&ext=${encodeURIComponent(prev.ext)}&from=movies`;
      router.replace(url);
    } catch (error: any) {
      console.error('Erro ao navegar para filme anterior:', error);
      Alert.alert('Erro', `Não foi possível navegar: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const handlePlaybackError = async (err: any) => {
    console.error('Playback error', err);
    
    if (retryCount < MAX_RETRIES) {
      const fallbackUrls = [
        finalUri,
        fallback,
        effectiveUri,
        playUri,
      ].filter(Boolean).filter((url, index, self) => self.indexOf(url) === index);
      
      const currentUrlIndex = fallbackUrls.indexOf(finalUri);
      if (currentUrlIndex < fallbackUrls.length - 1) {
        const nextUrl = fallbackUrls[currentUrlIndex + 1];
        console.log(`[PLAYER] Tentando fallback URL ${currentUrlIndex + 2}/${fallbackUrls.length}`);
        try {
          if (videoRef.current) {
            await videoRef.current.unloadAsync();
            await videoRef.current.loadAsync({ uri: nextUrl as string }, { shouldPlay: true });
            setRetryCount(0);
            return;
          }
        } catch (fallbackError) {
          console.error('Fallback URL também falhou:', fallbackError);
        }
      }
      
      const delay = Math.min(2000 * Math.pow(2, retryCount), 10000);
      setTimeout(() => {
        attemptReload();
      }, delay);
    } else {
      Alert.alert(
        'Erro de reprodução',
        'Não foi possível reproduzir o stream após várias tentativas.\n\nVerifique sua conexão e tente novamente.',
        [
          { text: 'Tentar Novamente', onPress: () => {
            setRetryCount(0);
            attemptReload();
          }},
          { text: 'Voltar', onPress: handleBack, style: 'cancel' },
        ]
      );
    }
  };

  // Carregar conteúdo para o submenu
  const loadContentForMenu = useCallback(async (contentType: 'live' | 'movies' | 'series') => {
    if (!iptvConfig) return;
    setContentLoading(true);
    try {
      const token = await AsyncStorage.getItem('@ultraiptv_token');
      if (!token) return;

      const endpoint = contentType === 'live' ? API_ENDPOINTS.LIVE 
        : contentType === 'movies' ? API_ENDPOINTS.MOVIES 
        : API_ENDPOINTS.SERIES;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...buildIptvHeaders(iptvConfig),
        },
      });

      if (response.ok) {
        const data = await response.json();
        const items = contentType === 'live' ? (data.channels || [])
          : contentType === 'movies' ? (data.movies || [])
          : (data.series || []);

        const mapped: ContentItem[] = items.slice(0, 50).map((item: any) => ({
          id: item.id || String(Math.random()),
          title: item.name || item.title || 'Sem título',
          poster: item.poster,
          logo: item.logo,
          stream_url: item.stream_url || item.url || '',
          direct_url: item.direct_url,
          category: item.category,
          type: contentType,
        }));

        setContentItems(mapped);
      }
    } catch (error) {
      console.error('Erro ao carregar conteúdo:', error);
    } finally {
      setContentLoading(false);
    }
  }, [iptvConfig]);

  // Abrir menu de conteúdo
  const openContentMenu = useCallback(() => {
    if (isLocked) return;
    setShowContentMenu(true);
    Animated.timing(menuSlideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    // Carregar conteúdo baseado no tipo atual
    const contentType = normalizedType === 'series' ? 'series' 
      : normalizedType === 'movie' || normalizedType === 'movies' ? 'movies' 
      : 'live';
    loadContentForMenu(contentType as 'live' | 'movies' | 'series');
  }, [menuSlideAnim, normalizedType, loadContentForMenu, isLocked]);

  // Fechar menu de conteúdo
  const closeContentMenu = useCallback(() => {
    Animated.timing(menuSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowContentMenu(false);
      setContentItems([]);
      setContentSearchQuery('');
    });
  }, [menuSlideAnim]);

  // Selecionar item do menu
  const handleContentSelect = useCallback(async (item: ContentItem) => {
    const playbackUrl = settings.streamFormat === 'direct' && item.direct_url 
      ? item.direct_url 
      : item.stream_url;
    
    if (!playbackUrl) {
      Alert.alert('Erro', 'Este item não possui URL de stream disponível.');
      return;
    }

    let ext = (playbackUrl.split('.').pop() || '').split('?')[0];
    ext = (!ext || ext.toLowerCase() === 'null' || ext.toLowerCase() === 'undefined' || /[^a-z0-9]/i.test(ext) || ext.length > 4) 
      ? (item.type === 'live' ? 'm3u8' : 'mp4') 
      : ext.toLowerCase();

    try {
      await AsyncStorage.setItem('@ultraiptv_playback', JSON.stringify({ 
        uri: playbackUrl, 
        title: item.title, 
        type: item.type, 
        sid: item.id, 
        ext 
      }));
    } catch {}

    closeContentMenu();
    
    const url = `/player?uri=${encodeURIComponent(playbackUrl)}&title=${encodeURIComponent(item.title)}&type=${item.type}&sid=${encodeURIComponent(item.id)}&ext=${encodeURIComponent(ext)}&from=${item.type === 'series' ? 'series' : item.type === 'movie' ? 'movies' : 'live'}`;
    router.replace(url);
  }, [settings.streamFormat, closeContentMenu, router]);

  if (!finalUri) {
    if (iptvLoading) {
      return (
        <View style={styles.container}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={styles.errorText}>Carregando player...</Text>
        </View>
      );
    }
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>URL do vídeo não fornecida</Text>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={palette.primary} />
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const filteredContentItems = contentItems.filter(item => 
    contentSearchQuery ? item.title.toLowerCase().includes(contentSearchQuery.toLowerCase()) : true
  );

  return (
    <View 
      style={styles.container} 
      nativeID="ultraiptv-player-root"
      {...(Platform.OS === 'web' ? { id: 'ultraiptv-player-root' } : {})}
    >
      <Video
        ref={videoRef}
        style={styles.video}
        source={{ uri: finalUri as string }}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay
        isLooping={false}
        onPlaybackStatusUpdate={(status) => {
          setStatus(status);
          pingWatchdog();
          if (status.isLoaded) {
            setLoading(false);
            setIsPlaying(status.isPlaying);
            
            // Atualizar duração sempre que disponível (CRÍTICO para seek funcionar)
            if (status.durationMillis && status.durationMillis > 0) {
              const durSeconds = status.durationMillis / 1000;
              // Sempre atualizar se mudou ou se ainda não foi definida
              if (duration <= 0 || Math.abs(durSeconds - duration) > 0.5) {
                console.log('[PLAYER] ✅ Duração atualizada:', durSeconds, 'segundos (anterior:', duration, ')');
                setDuration(durSeconds);
              }
            } else if (isVod && duration <= 0) {
              // Se é VOD mas não tem duração ainda, logar para debug
              console.log('[PLAYER] ⚠️ VOD sem duração ainda:', { isVod, duration, hasDuration: !!status.durationMillis });
            }
            
            // Atualizar tempo atual apenas se não estiver fazendo seek
            if (!isSeeking && status.positionMillis !== undefined) {
              const posSeconds = status.positionMillis / 1000;
              // Só atualizar se a diferença for significativa para evitar atualizações muito frequentes
              if (Math.abs(posSeconds - currentTime) > 0.1) {
                setCurrentTime(posSeconds);
              }
            }
            
            if (status.isPlaying) setRetryCount(0);
          }
          const err = (status as any)?.error;
          if (err) {
            handlePlaybackError(err);
          }
        }}
        onLoadStart={() => setLoading(true)}
        onLoad={() => setLoading(false)}
        onError={(e) => handlePlaybackError(e)}
      />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      )}

      {/* Overlay superior - Título e botão voltar */}
      <Animated.View 
        style={[
          styles.topOverlay,
          { opacity: showControls ? controlsOpacity : 0, pointerEvents: showControls ? 'auto' : 'none' }
        ]}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
          <View style={styles.topHeader}>
            <Pressable
              style={({ pressed }) => [
                styles.backButtonTop,
                pressed && styles.backButtonTopPressed
              ]}
              onPress={handleBack}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.15)']}
                style={styles.backButtonTopGradient}
              >
                <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
              </LinearGradient>
            </Pressable>
            {title && (
              <View style={styles.topTitleContainer}>
                <Text style={styles.topTitle} numberOfLines={1}>{title}</Text>
              </View>
            )}
          </View>
      </Animated.View>

      {/* Overlay inferior - Controles e barra de progresso */}
      <Animated.View 
        style={[
          styles.bottomOverlay,
          { opacity: showControls ? controlsOpacity : 0, pointerEvents: showControls ? 'auto' : 'none' }
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.15)']}
          style={StyleSheet.absoluteFill}
          locations={[0, 0.7]}
        />
        
        {/* Barra de progresso na parte inferior - melhorada */}
        {!isLocked && (
          <View style={styles.progressContainer}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Pressable
              ref={progressBarRef}
              style={styles.progressBarContainer}
              onLayout={(e) => {
                const { x, width } = e.nativeEvent.layout;
                setProgressBarLayout({ x, width });
                console.log('[SEEK] Barra de progresso layout atualizado:', { x, width });
              }}
              onPress={async (e) => {
                console.log('[SEEK] onPress barra de progresso disparado', { isVod, isLocked, progressBarLayout });
                if (isLocked) {
                  console.log('[SEEK] Seek bloqueado: controles travados');
                  return;
                }
                
                // Tentar obter duração do status se não estiver disponível
                let effectiveDuration = duration;
                if (effectiveDuration <= 0 && videoRef.current) {
                  try {
                    const status = await videoRef.current.getStatusAsync();
                    if (status.isLoaded && status.durationMillis && status.durationMillis > 0) {
                      effectiveDuration = status.durationMillis / 1000;
                      setDuration(effectiveDuration);
                      console.log('[SEEK] ✅ Duração obtida do status no toque:', effectiveDuration);
                    }
                  } catch (err) {
                    console.warn('[SEEK] Erro ao obter duração:', err);
                  }
                }
                
                const progressBarWidth = progressBarLayout.width || (width - 200);
                if (progressBarWidth > 0) {
                  const touchX = e.nativeEvent.locationX;
                  const percentage = Math.max(0, Math.min(1, touchX / progressBarWidth));
                  
                  if (isVod) {
                    // Se não tiver duração, estimar
                    const finalDuration = effectiveDuration > 0 ? effectiveDuration : Math.max(currentTime * 2, 3600);
                    const targetPosition = percentage * finalDuration;
                    console.log('[SEEK] Toque direto na barra:', targetPosition, 'segundos (duration:', finalDuration, ')');
                    handleSeekToPosition(targetPosition);
                  } else {
                    // Para live streams, tentar seek relativo
                    console.log('[SEEK] Live stream - tentando seek relativo');
                  }
                } else {
                  console.warn('[SEEK] Largura da barra não disponível');
                }
              }}
              // Adicionar handlers para responder (web e dispositivos)
              onStartShouldSetResponder={() => true}
              onResponderGrant={(e) => handleProgressResponderGrant(e)}
              onResponderMove={(e) => handleProgressResponderMove(e)}
              onResponderRelease={(e) => handleProgressResponderRelease(e)}
              // Pointer handlers for web compatibility
              onPointerDown={(e) => handleProgressPointerDown(e as any)}
              onPointerMove={(e) => handleProgressPointerMove(e as any)}
              onPointerUp={(e) => handleProgressPointerUp(e as any)}
              {...(isVod ? progressPanResponder.panHandlers : {})}
            >
              <View style={styles.progressBar}>
                {isVod && duration > 0 ? (
                  <>
                    <View style={[styles.progressBarFilled, { width: `${Math.min(100, Math.max(0, (currentTime / duration) * 100))}%` }]} />
                    <View style={[styles.progressScrubber, { left: `${Math.min(100, Math.max(0, (currentTime / duration) * 100))}%` }]} />
                  </>
                ) : (
                  // Para live streams, mostrar barra de buffer
                  <View style={[styles.progressBarFilled, { width: '100%', opacity: 0.3 }]} />
                )}
              </View>
            </Pressable>
            <Text style={styles.timeText}>
              {isVod && duration > 0 ? formatTime(duration) : normalizedType === 'live' ? 'LIVE' : '--:--'}
            </Text>
          </View>
        )}

        {/* Controles */}
          <View style={styles.controlsRow}>
            <Pressable
            style={({ pressed }) => [styles.controlButton, pressed && styles.controlButtonPressed]}
              onPress={() => setIsLocked(!isLocked)}
            >
            <Ionicons 
              name={isLocked ? "lock-closed" : "lock-open"} 
              size={24} 
              color="#FFFFFF" 
            />
            </Pressable>

            <Pressable
            style={({ pressed }) => [styles.controlButton, pressed && styles.controlButtonPressed]}
              onPress={toggleFullscreen}
              disabled={isLocked}
            >
            <Ionicons 
              name={isFullscreen ? "contract" : "expand"} 
              size={24} 
              color="#FFFFFF" 
            />
            </Pressable>

          {(normalizedType === 'series' || normalizedType === 'movie') && (
            <Pressable
              style={({ pressed }) => [
                styles.controlButton,
                pressed && styles.controlButtonPressed,
                isLocked && styles.controlButtonDisabled
              ]}
              onPress={() => {
                if (isLocked) return;
                showControlsWithTimeout();
                if (normalizedType === 'series') goPrevEpisode();
                else if (normalizedType === 'movie' || normalizedType === 'movies') goPrevMovie();
              }}
              disabled={isLocked}
            >
              <Ionicons name="play-skip-back" size={24} color="#FFFFFF" />
            </Pressable>
          )}

            <Pressable
            style={({ pressed }) => [
              styles.controlButton, 
              pressed && styles.controlButtonPressed,
              isLocked && styles.controlButtonDisabled
            ]}
            onPress={() => {
              if (isLocked) return;
              handleSeek(-10);
            }}
              disabled={isLocked}
            >
            <Ionicons name="play-back" size={24} color="#FFFFFF" />
            </Pressable>

            <Pressable
            style={({ pressed }) => [styles.centerButton, pressed && styles.centerButtonPressed]}
              onPress={handlePlayPause}
            >
              <View style={styles.centerButtonInner}>
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={48} 
                color="#FFFFFF" 
              />
              </View>
            </Pressable>

            <Pressable
            style={({ pressed }) => [
              styles.controlButton, 
              pressed && styles.controlButtonPressed,
              isLocked && styles.controlButtonDisabled
            ]}
            onPress={() => {
              if (isLocked) return;
              handleSeek(10);
            }}
              disabled={isLocked}
            >
            <Ionicons name="play-forward" size={24} color="#FFFFFF" />
            </Pressable>

          {(normalizedType === 'series' || normalizedType === 'movie') && (
            <Pressable
              style={({ pressed }) => [
                styles.controlButton,
                pressed && styles.controlButtonPressed,
                isLocked && styles.controlButtonDisabled
              ]}
              onPress={() => {
                if (isLocked) return;
                showControlsWithTimeout();
                if (normalizedType === 'series') goNextEpisode();
                else if (normalizedType === 'movie' || normalizedType === 'movies') goNextMovie();
              }}
              disabled={isLocked}
            >
              <Ionicons name="play-skip-forward" size={24} color="#FFFFFF" />
            </Pressable>
          )}

            <Pressable
            style={({ pressed }) => [styles.controlButton, pressed && styles.controlButtonPressed]}
            onPress={handleToggleMute}
              disabled={isLocked}
            >
            <Ionicons 
              name={isMuted ? "volume-mute" : "volume-high"} 
              size={24} 
              color="#FFFFFF" 
            />
            </Pressable>

            <Pressable
            style={({ pressed }) => [styles.controlButton, pressed && styles.controlButtonPressed]}
              onPress={() => {
                if (isLocked) return;
                setShowSettings(!showSettings);
              }}
              disabled={isLocked}
            >
            <Ionicons name="settings" size={24} color="#FFFFFF" />
            </Pressable>

            <Pressable
            style={({ pressed }) => [
              styles.controlButton, 
              pressed && styles.controlButtonPressed,
              styles.menuButton
            ]}
              onPress={() => {
                if (isLocked) return;
                openContentMenu();
              }}
              disabled={isLocked}
            >
              <LinearGradient
                colors={['rgba(0, 224, 255, 0.3)', 'rgba(0, 224, 255, 0.2)']}
                style={styles.menuButtonGradient}
              >
                <Ionicons name="menu" size={24} color="#FFFFFF" />
              </LinearGradient>
            </Pressable>
          </View>

        {/* Menu de configurações */}
          {showSettings && !isLocked && (
            <View style={styles.settingsMenu}>
              <Text style={styles.settingsMenuTitle}>Configurações</Text>
              <Pressable style={styles.settingsMenuItem} onPress={handleCycleSpeed}>
              <Text style={styles.settingsMenuLabel}>Velocidade</Text>
                <Text style={styles.settingsMenuValue}>{playbackSpeed}x</Text>
              </Pressable>
              <Pressable 
                style={styles.settingsMenuItem} 
                onPress={() => {
                  setSelectedQuality(selectedQuality === 'auto' ? 'high' : selectedQuality === 'high' ? 'medium' : 'auto');
                }}
              >
                <Text style={styles.settingsMenuLabel}>Qualidade</Text>
                <Text style={styles.settingsMenuValue}>
                  {selectedQuality === 'auto' ? 'Automática' : selectedQuality === 'high' ? 'Alta' : 'Média'}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Data e hora */}
          <View style={styles.dateTimeContainer}>
            <Text style={styles.dateTimeText}>
            {format(new Date(), "EEEE, HH:mm", { locale: ptBR })}
            </Text>
          </View>
      </Animated.View>

      {/* Indicador de bloqueio */}
      {isLocked && (
        <View style={styles.lockIndicator}>
          <Ionicons name="lock-closed" size={32} color="#FFFFFF" />
          <Text style={styles.lockIndicatorSubtext}>Toque para desbloquear</Text>
        </View>
      )}

      {/* Área de toque para mostrar/ocultar controles */}
      <Pressable 
        style={styles.tapArea} 
          onPress={() => {
            if (isLocked) {
              setIsLocked(false);
            showControlsWithTimeout();
            } else {
            showControlsWithTimeout();
            }
          }} 
        />

      {/* Overlay de fundo do submenu */}
      {showContentMenu && (
        <Animated.View
          style={[
            styles.contentMenuBackdrop,
            {
              opacity: menuSlideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
            },
          ]}
          pointerEvents={showContentMenu ? 'auto' : 'none'}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeContentMenu}
          />
        </Animated.View>
      )}

      {/* Submenu de conteúdo */}
      {showContentMenu && (
        <Animated.View 
          style={[
            styles.contentMenuOverlay,
            {
              opacity: menuSlideAnim,
              transform: [{
                translateX: menuSlideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [width, 0],
                }),
              }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(15, 23, 42, 0.98)', 'rgba(3, 7, 18, 0.98)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.contentMenuHeader}>
            <View style={styles.contentMenuHeaderLeft}>
              <Text style={styles.contentMenuTitle}>
                {normalizedType === 'series' ? 'Séries' : normalizedType === 'movie' || normalizedType === 'movies' ? 'Filmes' : 'Canais'}
              </Text>
              {contentItems.length > 0 && (
                <Text style={styles.contentMenuSubtitle}>
                  {contentItems.length} {normalizedType === 'series' ? 'séries' : normalizedType === 'movie' || normalizedType === 'movies' ? 'filmes' : 'canais'} disponíveis
                </Text>
              )}
            </View>
            <Pressable 
              style={({ pressed }) => [
                styles.contentMenuCloseButton,
                pressed && styles.contentMenuCloseButtonPressed
              ]} 
              onPress={closeContentMenu}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
                style={styles.contentMenuCloseButtonGradient}
              >
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </LinearGradient>
            </Pressable>
      </View>

          {/* Controles de navegação no menu - sempre mostrar para TV ao vivo e VOD */}
          {(normalizedType === 'live' || isVod) && (
            <View style={styles.contentMenuControls}>
              <Pressable
                style={({ pressed }) => [
                  styles.contentMenuControlButton,
                  pressed && styles.contentMenuControlButtonPressed,
                  isLocked && styles.contentMenuControlButtonDisabled
                ]}
                onPress={() => {
                  console.log('[SEEK] botão << -10 pressionado', { isLocked, isVod, currentTime });
                  if (isLocked) return;
                  handleSeek(-10);
                }}
                disabled={isLocked}
              >
                <Ionicons name="play-back" size={28} color="#FFFFFF" />
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.contentMenuControlButton,
                  pressed && styles.contentMenuControlButtonPressed
                ]}
                onPress={handlePlayPause}
              >
                <Ionicons 
                  name={isPlaying ? "pause" : "play"} 
                  size={32} 
                  color="#FFFFFF" 
                />
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.contentMenuControlButton,
                  pressed && styles.contentMenuControlButtonPressed,
                  isLocked && styles.contentMenuControlButtonDisabled
                ]}
                onPress={() => {
                  console.log('[SEEK] botão >> +10 pressionado', { isLocked, isVod, currentTime });
                  if (isLocked) return;
                  handleSeek(10);
                }}
                disabled={isLocked}
              >
                <Ionicons name="play-forward" size={28} color="#FFFFFF" />
              </Pressable>
            </View>
          )}

          <View style={styles.contentMenuSearch}>
            <TextInput
              value={contentSearchQuery}
              onChangeText={setContentSearchQuery}
              placeholder="Pesquisar..."
              placeholderTextColor={palette.textSecondary}
              style={styles.contentMenuSearchInput}
            />
            <Ionicons name="search" size={20} color={palette.textSecondary} />
          </View>

          {contentLoading ? (
            <View style={styles.contentMenuLoading}>
              <ActivityIndicator size="large" color={palette.primary} />
            </View>
          ) : (
            <FlatList
              data={filteredContentItems}
              keyExtractor={(item, index) => `${String(item.id || 'content')}_${index}`}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.contentMenuItem,
                    pressed && styles.contentMenuItemPressed
                  ]}
                  onPress={() => handleContentSelect(item)}
                >
                  {item.poster || item.logo ? (
                    <Image 
                      source={{ uri: item.poster || item.logo }} 
                      style={styles.contentMenuItemImage as any} 
                    />
                  ) : (
                    <View style={styles.contentMenuItemPlaceholder}>
                      <Text style={styles.contentMenuItemPlaceholderText}>
                        {item.type === 'live' ? '📺' : item.type === 'movie' ? '🎬' : '🎭'}
                      </Text>
                    </View>
                  )}
                  <View style={styles.contentMenuItemInfo}>
                    <Text style={styles.contentMenuItemTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    {item.category && (
                      <Text style={styles.contentMenuItemCategory}>{item.category}</Text>
                    )}
                  </View>
                </Pressable>
              )}
              contentContainerStyle={styles.contentMenuList}
            />
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: palette.background,
  },
  video: {
    width,
    height,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(3, 7, 18, 0.85)',
    zIndex: 100,
  },
  loadingText: {
    color: palette.textPrimary,
    marginTop: 10,
    fontSize: 16,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 10,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonTop: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 12,
  },
  backButtonTopGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  backButtonTopPressed: {
    transform: [{ scale: 0.92 }],
  },
  backButtonTopText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
    letterSpacing: -1,
  },
  topTitleContainer: {
    flex: 1,
  },
  topTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 0.3,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 0,
    zIndex: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 6,
    paddingBottom: 0,
    marginTop: 0,
    backgroundColor: 'transparent',
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    minWidth: 70,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 1,
    paddingHorizontal: 4,
  },
  progressBarContainer: {
    flex: 1,
    marginHorizontal: 12,
    height: 60,
    justifyContent: 'center',
    paddingVertical: 16,
    minHeight: 60,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 4,
    position: 'relative',
    overflow: 'visible',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressBarFilled: {
    height: '100%',
    backgroundColor: palette.primary,
    borderRadius: 4,
    position: 'absolute',
    left: 0,
    top: 0,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 5,
  },
  progressScrubber: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    top: -8,
    marginLeft: -12,
    borderWidth: 4,
    borderColor: palette.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 10,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    paddingVertical: 8,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  controlButtonPressed: {
    transform: [{ scale: 0.92 }],
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  controlButtonDisabled: {
    opacity: 0.35,
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  menuButton: {
    overflow: 'hidden',
  },
  menuButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(0, 224, 255, 0.5)',
  },
  centerButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 5,
    borderColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 224, 255, 0.25)',
    marginHorizontal: 16,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 16,
  },
  centerButtonPressed: {
    transform: [{ scale: 0.94 }],
    backgroundColor: 'rgba(0, 224, 255, 0.3)',
    shadowOpacity: 0.8,
  },
  centerButtonInner: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  centerButtonText: {
    color: '#000000',
    fontSize: 36,
    fontWeight: '900',
    textShadowColor: 'rgba(255, 255, 255, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  settingsMenu: {
    marginTop: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  settingsMenuTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  settingsMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingsMenuLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  settingsMenuValue: {
    color: palette.primary,
    fontSize: 15,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 224, 255, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dateTimeContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  dateTimeText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.5,
  },
  lockIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 32,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: palette.primary,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 12,
  },
  lockIndicatorText: {
    fontSize: 56,
    marginBottom: 12,
    textShadowColor: 'rgba(0, 224, 255, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  lockIndicatorSubtext: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tapArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  backButton: {
    padding: 15,
    backgroundColor: 'rgba(3,7,18,0.7)',
    borderRadius: 8,
    margin: 20,
  },
  backButtonText: {
    color: palette.textPrimary,
    fontSize: 16,
  },
  errorText: {
    color: palette.textPrimary,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  // Estilos do submenu de conteúdo
  contentMenuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 999,
  },
  contentMenuOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: Math.min(width * 0.85, 600),
    zIndex: 1000,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
  },
  contentMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  contentMenuHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  contentMenuTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  contentMenuSubtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    fontWeight: '500',
  },
  contentMenuCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  contentMenuCloseButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
  },
  contentMenuCloseButtonPressed: {
    transform: [{ scale: 0.9 }],
  },
  contentMenuCloseText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  contentMenuControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    margin: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  contentMenuControlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  contentMenuControlButtonPressed: {
    transform: [{ scale: 0.92 }],
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  contentMenuControlButtonDisabled: {
    opacity: 0.35,
  },
  contentMenuControlButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  contentMenuSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  contentMenuSearchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 12,
  },
  contentMenuSearchIcon: {
    color: palette.textSecondary,
    fontSize: 18,
    marginLeft: 8,
  },
  contentMenuLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  contentMenuList: {
    padding: 16,
    paddingBottom: 40,
  },
  contentMenuItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    marginBottom: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  contentMenuItemPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(0, 224, 255, 0.5)',
    transform: [{ scale: 0.98 }],
  },
  contentMenuItemImage: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: palette.backgroundAlt,
  },
  contentMenuItemPlaceholder: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: palette.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentMenuItemPlaceholderText: {
    fontSize: 32,
  },
  contentMenuItemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  contentMenuItemTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  contentMenuItemCategory: {
    color: palette.textSecondary,
    fontSize: 12,
  },
});
