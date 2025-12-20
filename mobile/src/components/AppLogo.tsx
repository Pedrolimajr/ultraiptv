import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme/palette';

let logoSource: any = null;
try {
  logoSource = require('../../assets/logo.png');
} catch (_) {
  logoSource = null;
}

interface AppLogoProps {
  size?: number;
  stacked?: boolean;
  showWordmark?: boolean;
}

export default function AppLogo({ size = 48, stacked = false, showWordmark = true }: AppLogoProps) {
  const dimension = { width: size * (stacked ? 2 : 2.4), height: size * 1.2 };

  if (logoSource) {
    return (
      <View style={styles.container}>
        <Image
          source={logoSource}
          style={[styles.image, dimension]}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <View style={[styles.fallback, dimension]}>
      <Text style={styles.fallbackTitle}>ULTRA</Text>
      {showWordmark && <Text style={styles.fallbackSubtitle}>IPTV</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    maxWidth: 220,
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.primary,
    padding: 8,
  },
  fallbackTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: palette.primary,
    letterSpacing: 4,
  },
  fallbackSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.textPrimary,
    letterSpacing: 6,
  },
});


