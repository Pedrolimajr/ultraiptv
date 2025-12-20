import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useIptvConfig } from '../context/IptvContext';
import { palette } from '../theme/palette';

interface Props {
  visible: boolean;
  onClose: () => void;
  initialProfile?: any | null;
  editingId?: string | null;
}

const sanitizeUrl = (value: string) => {
  if (!value) return value;
  let sanitized = value.trim().replace(/^['"`]+|['"`]+$/g, '');
  
  // Preserva a porta se existir (ex: :80, :8080)
  const hasProtocol = /^https?:\/\//i.test(sanitized);
  
  if (!hasProtocol) {
    sanitized = `http://${sanitized}`;
  }
  
  // Remove barras finais, mas preserva porta
  sanitized = sanitized.replace(/\/+$/, '');
  
  // Remove player_api.php se existir (para compatibilidade com Xtream)
  sanitized = sanitized.replace(/\/player_api\.php$/i, '');

  return sanitized;
};

export default function IptvConfigModal({ visible, onClose, initialProfile, editingId }: Props) {
  const { config, saveConfig, clearConfig, addProfile, updateProfile } = useIptvConfig();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(config?.name || '');
      setUsername(config?.username || '');
      setPassword(config?.password || '');
      setBaseUrl(config?.baseUrl || '');
      // Reseta o estado de submitting quando o modal abre
      setSubmitting(false);
      // Limpar campos se não estiver editando
      if (!config) {
        setName('');
        setUsername('');
        setPassword('');
        setBaseUrl('');
      }
    }
  }, [visible, config]);

  useEffect(() => {
    // Se abrir o modal com um perfil inicial (edição via PlaylistManagerModal)
    if (visible && (initialProfile || editingId)) {
      setName(initialProfile?.name || '');
      setUsername(initialProfile?.username || '');
      setPassword(initialProfile?.password || '');
      setBaseUrl(initialProfile?.baseUrl || '');
      setSubmitting(false);
    }
  }, [visible, initialProfile, editingId]);
  
  const [testResult, setTestResult] = useState<string | null>(null);

  // Preencher campos quando abrir em modo edição a partir do PlaylistManagerModal
  useEffect(() => {
    if (visible && (arguments as any)[0] && (arguments as any)[0].initialProfile) return; // guard - deprecated method
  }, [visible]);

  const handleSave = async () => {
    if (!name.trim() || !username.trim() || !password.trim() || !baseUrl.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha todos os campos para salvar.');
      return;
    }

    const normalizedUrl = sanitizeUrl(baseUrl);
    setSubmitting(true);

    try {
      // Validação de conexão rápida
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const testUrl = `${normalizedUrl}/player_api.php?username=${encodeURIComponent(username.trim())}&password=${encodeURIComponent(password.trim())}&action=get_live_categories`;
      let ok = false;
      try {
        const res = await fetch(testUrl, { signal: (controller as any).signal });
        clearTimeout(timeout);
        if (res.ok) {
          try {
            const json = await res.json();
            if (json && (Array.isArray(json) || typeof json === 'object')) ok = true;
          } catch (e) { ok = false; }
        }
      } catch (_) { ok = false; }

      if (!ok) {
        Alert.alert('Erro', 'Não foi possível conectar com a URL/credenciais fornecidas. Campos serão limpos.');
        setName(''); setUsername(''); setPassword(''); setBaseUrl('');
        setSubmitting(false);
        onClose();
        return;
      }

      // Salva como profile ou atualiza se estiver em modo edição
      if (editingId) {
        await updateProfile(editingId, {
          name: name.trim(),
          username: username.trim(),
          password: password.trim(),
          baseUrl: normalizedUrl,
        });
      } else {
        await addProfile({
          name: name.trim(),
          username: username.trim(),
          password: password.trim(),
          baseUrl: normalizedUrl,
        });
      }

      const savedName = name.trim();
      setName(''); setUsername(''); setPassword(''); setBaseUrl(''); setTestResult(null);
      setSubmitting(false);
      Alert.alert('✅ Playlist salva', `Playlist "${savedName}" foi salva com sucesso!`, [{ text: 'OK', onPress: () => onClose() }]);
    } catch (error: any) {
      console.error('[IPTV Config] Erro ao salvar:', error);
      setSubmitting(false);
      Alert.alert('Erro', error.message || 'Não foi possível salvar a playlist.');
    }
  };

    const handleClear = () => {
      Alert.alert('Remover playlist', 'Deseja remover a playlist atual?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearConfig();
              setName(''); setUsername(''); setPassword(''); setBaseUrl('');
              onClose();
            } catch (e) {
              Alert.alert('Erro', 'Não foi possível remover a playlist.');
            }
          }
        }
      ]);
    };

    return (
      <Modal visible={visible} animationType="fade" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.overlay}
        >
          <View style={styles.container}>
            <Text style={styles.title}>Configurar Playlist</Text>
            <TextInput
            style={styles.input}
            placeholder="Nome amigável"
            placeholderTextColor="#8a8a8a"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Usuário"
            placeholderTextColor="#8a8a8a"
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor="#8a8a8a"
            autoCapitalize="none"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="URL com porta (ex: http://dominio.com:8080)"
            placeholderTextColor="#8a8a8a"
            autoCapitalize="none"
            autoCorrect={false}
            value={baseUrl}
            onChangeText={setBaseUrl}
          />

          <View style={styles.actions}>
            {config && (
              <TouchableOpacity style={[styles.button, styles.clear]} onPress={handleClear}>
                <Text style={styles.buttonText}>Remover</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.button, styles.cancel]} 
              onPress={() => {
                setSubmitting(false);
                onClose();
              }}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.save]}
              onPress={handleSave}
              disabled={submitting}
            >
              <Text style={styles.buttonText}>{submitting ? 'Salvando...' : 'Salvar'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
    maxWidth: 500,
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
    marginBottom: 16,
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
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
  clear: {
    backgroundColor: '#b91c1c',
    borderColor: '#b91c1c',
  },
  buttonText: {
    color: palette.textPrimary,
    fontWeight: '600',
  },
});

