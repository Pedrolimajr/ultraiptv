import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

/**
 * Hook para navegação TV (D-pad)
 * Adiciona suporte a navegação por controle remoto
 */
export function useTVNavigation() {
  const focusRefs = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Navegação D-pad simulada para web
        const focused = document.activeElement;
        if (!focused) return;

        switch (e.key) {
          case 'ArrowUp':
          case 'ArrowDown':
          case 'ArrowLeft':
          case 'ArrowRight':
            // Navegação será tratada pelos componentes
            break;
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  return {
    registerFocusable: (id: string, ref: any) => {
      focusRefs.current.set(id, ref);
    },
    unregisterFocusable: (id: string) => {
      focusRefs.current.delete(id);
    },
  };
}

