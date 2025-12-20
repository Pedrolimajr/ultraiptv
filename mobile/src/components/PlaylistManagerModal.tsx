import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useIptvConfig } from '../context/IptvContext';
import IptvConfigModal from './IptvConfigModal';
import { palette } from '../theme/palette';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const sanitizeUrl = (value: string) => {
  if (!value) return value;
  let sanitized = value.trim().replace(/^['"`]+|['"`]+$/g, '');
  const hasProtocol = /^https?:\/\//i.test(sanitized);
  if (!hasProtocol) {
    sanitized = `http://${sanitized}`;
  }
  sanitized = sanitized.replace(/\/+$/, '');
  sanitized = sanitized.replace(/\/player_api\.php$/i, '');
  return sanitized;
};

export default function PlaylistManagerModal({ visible, onClose }: Props) {
  const {
    profiles,
    activeId,
    addProfile,
    updateProfile,
    removeProfile,
    setActiveProfile,
  } = useIptvConfig();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configInitial, setConfigInitial] = useState<any | null>(null);

  useEffect(() => {
    if (!visible) {
      setEditingId(null);
      setName('');
      setUsername('');
      setPassword('');
      setBaseUrl('');
      setSubmitting(false);
      setQuery('');
    }
  }, [visible]);

  const filteredProfiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.baseUrl.toLowerCase().includes(q) ||
      p.username.toLowerCase().includes(q)
    );
  }, [profiles, query]);

  const startEdit = (id: string) => {
    const p = profiles.find(x => x.id === id);
    if (!p) return;
    // Abrir modal de configuração para edição
    setEditingId(id);
    setShowConfigModal(true);
    setConfigInitial(p);
  };

  const handleSave = async () => {
    if (!name.trim() || !username.trim() || !password.trim() || !baseUrl.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha todos os campos.');
      return;
    }
    const normalizedUrl = sanitizeUrl(baseUrl);
    // Validação de conexão antes de salvar
    setSubmitting(true);
    setUpdating(true);
    setUpdateProgress('Conectando...');
    try {
      // Tenta conectar ao endpoint /player_api.php para validar credenciais
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const testUrl = `${normalizedUrl}/player_api.php?username=${encodeURIComponent(username.trim())}&password=${encodeURIComponent(password.trim())}&action=get_live_categories`;
      let ok = false;
      try {
        const res = await fetch(testUrl, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          // Tenta parsear JSON - se falhar, considerar erro
          try {
            const json = await res.json();
            if (json && (Array.isArray(json) || typeof json === 'object')) {
              ok = true;
            }
          } catch (e) {
            // Falha no parse -> considerar erro
            ok = false;
          }
        } else {
          ok = false;
        }
      } catch (err: any) {
        console.warn('[PLAYLIST] Erro ao validar playlist:', err?.message || err);
        ok = false;
      }

      if (!ok) {
        // Falha na conexão: limpar campos e fechar modal
        setUpdateProgress('Erro ao conectar');
        setTimeout(() => {
          setUpdating(false);
          setUpdateProgress('');
        }, 800);
        Alert.alert('Erro', 'Não foi possível conectar com a URL fornecida. Verifique a URL, usuário e senha.');
        setName(''); setUsername(''); setPassword(''); setBaseUrl('');
        setSubmitting(false);
        onClose();
        return;
      }

      // Se conectado com sucesso, persiste profile
      if (editingId) {
        await updateProfile(editingId, {
          name: name.trim(),
          username: username.trim(),
          password: password.trim(),
          baseUrl: normalizedUrl,
        });
        setEditingId(null);
      } else {
        await addProfile({
          name: name.trim(),
          username: username.trim(),
          password: password.trim(),
          baseUrl: normalizedUrl,
        });
      }

      setName(''); setUsername(''); setPassword(''); setBaseUrl('');
      setUpdateProgress('Conectado com sucesso!');
      await new Promise(resolve => setTimeout(resolve, 600));
      setUpdating(false);
      setUpdateProgress('');
      Alert.alert('Sucesso', 'Playlist salva com sucesso.');
      onClose();
    } catch (e: any) {
      console.error('[PLAYLIST] Erro ao salvar/validar:', e);
      Alert.alert('Erro', e?.message || 'Falha ao salvar playlist.');
      setUpdating(false);
      setUpdateProgress('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (profiles.length <= 1) {
      Alert.alert('Aviso', 'Você precisa ter pelo menos uma playlist cadastrada.');
      return;
    }
    
    Alert.alert('Remover playlist', 'Deseja remover esta playlist?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            setUpdating(true);
            setUpdateProgress('Removendo playlist...');
            await removeProfile(id);
            if (editingId === id) {
              setEditingId(null);
              setName('');
              setUsername('');
              setPassword('');
              setBaseUrl('');
            }
            setUpdateProgress('Playlist removida com sucesso!');
            await new Promise(resolve => setTimeout(resolve, 800));
            setUpdating(false);
            setUpdateProgress('');
          } catch (e: any) {
            setUpdating(false);
            setUpdateProgress('');
            Alert.alert('Erro', e?.message || 'Falha ao remover playlist.');
          }
        },
      },
    ]);
  };

  const handleSwitchPlaylist = async (id: string) => {
    if (activeId === id) {
      Alert.alert('Aviso', 'Esta playlist já está ativa.');
      return;
    }
    
    if (updating) return;
    
    try {
      setUpdating(true);
      setUpdateProgress('Ativando playlist...');
      
      await setActiveProfile(id);
      
      setUpdateProgress('Atualizando TV ao vivo...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUpdateProgress('Atualizando Filmes...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUpdateProgress('Atualizando Séries...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUpdateProgress('Playlist ativada com sucesso!');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setUpdating(false);
      setUpdateProgress('');
    } catch (error: any) {
      console.error('Erro ao ativar playlist:', error);
      setUpdateProgress('Erro ao atualizar playlist');
      Alert.alert('Erro', error?.message || 'Não foi possível ativar a playlist.');
      await new Promise(resolve => setTimeout(resolve, 2000));
      setUpdating(false);
      setUpdateProgress('');
    }
  };

  return (
    <>
    <Modal visible={visible} animationType="fade" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Playlists IPTV</Text>

          {updating && updateProgress && (
            <View style={styles.updateProgressContainer}>
              <ActivityIndicator size="small" color={palette.primary} />
              <Text style={styles.updateProgressText}>{updateProgress}</Text>
            </View>
          )}

          <TextInput
            style={styles.input}
            placeholder="Pesquisar playlist"
            placeholderTextColor="#8a8a8a"
            value={query}
            onChangeText={setQuery}
          />

          <FlatList
            data={filteredProfiles}
            keyExtractor={(item, index) => `${String(item.id || 'profile')}_${index}`}
            style={styles.list}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDesc}>{item.username} • {item.baseUrl}</Text>
                </View>
                <View style={styles.itemActions}>
                  {activeId === item.id ? (
                    <View style={[styles.badge, styles.badgeActive]}>
                      <Text style={styles.badgeText}>Ativa</Text>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.badge, styles.badgeInactive]} 
                      onPress={() => handleSwitchPlaylist(item.id)}
                      disabled={updating}
                    >
                      <Text style={styles.badgeText}>
                        {updating ? 'Atualizando...' : 'Ativar'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.smallBtn, styles.edit]} onPress={() => startEdit(item.id)}>
                    <Text style={styles.smallBtnText}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.smallBtn, styles.remove]} onPress={() => handleRemove(item.id)}>
                    <Text style={styles.smallBtnText}>Excluir</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={(
              <View style={styles.empty}> 
                <Text style={styles.emptyText}>Nenhuma playlist cadastrada</Text>
              </View>
            )}
          />

          <View style={styles.divider} />

          <TouchableOpacity style={[styles.button, styles.save, { alignSelf: 'flex-start' }]} onPress={() => {
            // Abrir modal de configuração para adicionar nova playlist
            setEditingId(null);
            setConfigInitial(null);
            setShowConfigModal(true);
          }}>
            <Text style={styles.buttonText}>➕ Adicionar playlist</Text>
          </TouchableOpacity>
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.button, styles.close]} onPress={onClose}>
              <Text style={styles.buttonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
    {showConfigModal && (
      <IptvConfigModal
        visible={showConfigModal}
        onClose={() => { setShowConfigModal(false); setEditingId(null); setConfigInitial(null); }}
        initialProfile={configInitial}
        editingId={editingId}
      />
    )}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 680,
    borderRadius: 20,
    padding: 24,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 12,
    padding: 14,
    color: palette.textPrimary,
    marginBottom: 12,
  },
  list: {
    maxHeight: 240,
    marginBottom: 12,
  },
  empty: {
    padding: 12,
    alignItems: 'center',
  },
  emptyText: {
    color: palette.textSecondary,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  itemInfo: {
    flex: 1,
    marginRight: 10,
  },
  itemName: {
    color: palette.textPrimary,
    fontWeight: '700',
    marginBottom: 4,
  },
  itemDesc: {
    color: palette.textSecondary,
    fontSize: 12,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  smallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  smallBtnText: {
    color: palette.textPrimary,
    fontWeight: '600',
    fontSize: 12,
  },
  edit: {
    backgroundColor: palette.surface,
  },
  remove: {
    backgroundColor: '#b91c1c',
    borderColor: '#b91c1c',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  badgeInactive: {
    backgroundColor: palette.surface,
    borderColor: palette.cardBorder,
  },
  badgeText: {
    color: palette.textPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: palette.cardBorder,
    marginVertical: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 10,
    flexWrap: 'wrap',
  },
  button: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  save: {
    backgroundColor: palette.primary,
  },
  cancel: {
    backgroundColor: palette.surface,
  },
  close: {
    backgroundColor: '#374151',
    borderColor: '#374151',
  },
  buttonText: {
    color: palette.textPrimary,
    fontWeight: '600',
  },
  updateProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 224, 255, 0.1)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: palette.primary,
  },
  updateProgressText: {
    color: palette.primary,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
});

