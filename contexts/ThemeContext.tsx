import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { COLORS, AccentColor } from '@/constants/theme';

const THEME_STORAGE_KEY = '@form_accent_color';

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const [accentColor, setAccentColorState] = useState<AccentColor>('orange');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAccentColor();
  }, []);

  const loadAccentColor = async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      const validColors: AccentColor[] = ['orange', 'purple', 'blue', 'red', 'yellow', 'green', 'teal'];
      if (stored && validColors.includes(stored as AccentColor)) {
        setAccentColorState(stored as AccentColor);
      }
    } catch (error) {
      console.error('Failed to load accent color:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setAccentColor = useCallback(async (color: AccentColor) => {
    try {
      setAccentColorState(color);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, color);
    } catch (error) {
      console.error('Failed to save accent color:', error);
    }
  }, []);

  const accent = COLORS.accents[accentColor];

  return useMemo(() => ({
    accentColor,
    accent,
    setAccentColor,
    isLoading,
  }), [accentColor, accent, setAccentColor, isLoading]);
});
