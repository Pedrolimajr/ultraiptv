import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Erro', 'Por favor, preencha usuário e senha');
      return;
    }

    setLoading(true);

    try {
      // Primeiro, tentar login na API externa
      const externalResponse = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!externalResponse.ok) {
        throw new Error('Credenciais inválidas');
      }

      const externalData = await externalResponse.json();

      // Verificar se a conta está expirada
      if (externalData.expired || externalData.expiration_date) {
        const expirationDate = new Date(externalData.expiration_date);
        const now = new Date();
        
        if (expirationDate < now) {
          Alert.alert(
            'Conta Expirada',
            'Sua conta expirou. Entre em contato com o suporte.',
            [{ text: 'OK' }]
          );
          setLoading(false);
          return;
        }
      }

      // Salvar token e dados do usuário
      await AsyncStorage.setItem('@ultraiptv_token', externalData.token || 'external_token');
      await AsyncStorage.setItem('@ultraiptv_user', JSON.stringify({
        username: externalData.username || username,
        expiration_date: externalData.expiration_date,
        ...externalData
      }));

      router.replace('/dashboard');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#0a0a0a', '#1a1a2e', '#16213e']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>ULTRAIPTV</Text>
            <View style={styles.logoCircle}>
              <View style={styles.playButton}>
                <View style={styles.playTriangle} />
              </View>
            </View>
          </View>

          {/* Formulário */}
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Usuário"
              placeholderTextColor="#666"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor="#666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <LinearGradient
                  colors={['#00D9FF', '#8B5CF6']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.loginButtonText}>ENTRAR</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#00D9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  playButton: {
    width: 0,
    height: 0,
    borderLeftWidth: 25,
    borderTopWidth: 15,
    borderBottomWidth: 15,
    borderLeftColor: '#00D9FF',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 5,
  },
  playTriangle: {
    width: 0,
    height: 0,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 4,
    textShadowColor: '#00D9FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.3)',
  },
  loginButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});

