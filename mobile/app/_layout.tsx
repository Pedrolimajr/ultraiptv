import { Stack } from 'expo-router';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import NetworkStatus from '../src/components/NetworkStatus';
import { SettingsProvider } from '../src/context/SettingsContext';
import { IptvProvider } from '../src/context/IptvContext';

// Ignorar todos os avisos
LogBox.ignoreAllLogs(true);

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
    if (typeof window !== 'undefined') {
      try {
        // For web, ensure page language is set to Portuguese and discourage automatic translation
        document.documentElement.lang = 'pt-BR';
        document.documentElement.setAttribute('translate', 'no');
        // Add meta tag to prevent Google Translate prompt
        let meta = document.querySelector('meta[name="google"]');
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', 'google');
          meta.setAttribute('content', 'notranslate');
          document.head.appendChild(meta);
        } else {
          meta.setAttribute('content', 'notranslate');
        }
        // Add notranslate class to body
        document.body.classList.add('notranslate');
      } catch (e) {
        // ignore
      }
    }
  }, []);

  return (
    <SettingsProvider>
      <IptvProvider>
        <NetworkStatus />
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { 
              backgroundColor: '#000000',
              flex: 1,
              width: '100%',
              height: '100%',
            },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="dashboard" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="player" />
          <Stack.Screen name="live" />
          <Stack.Screen name="movies" />
          <Stack.Screen name="series" />
          <Stack.Screen name="catchup" />
          <Stack.Screen name="multiscreen" />
          <Stack.Screen name="epg" />
        </Stack>
      </IptvProvider>
    </SettingsProvider>
  );
}

