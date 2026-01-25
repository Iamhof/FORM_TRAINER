import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { COLORS, AccentColor } from '@/constants/theme';
import { useUser } from './UserContext';
import { logger } from '@/lib/logger';

const THEME_STORAGE_KEY = '@form_accent_color';

const hexToAccentColor = (hex: string): AccentColor => {
  const colorMap: Record<string, AccentColor> = {
    '#FF6B55': 'orange',
    '#B266FF': 'purple',
    '#6699FF': 'blue',
    '#F44336': 'red',
    '#FFC107': 'yellow',
    '#4CAF50': 'green',
    '#009688': 'teal',
    '#EC407A': 'pink',
  };
  
  const upperHex = hex.toUpperCase();
  return colorMap[upperHex] || 'orange';
};

const accentColorToHex = (color: AccentColor): string => {
  const hexMap: Record<AccentColor, string> = {
    orange: '#FF6B55',
    purple: '#B266FF',
    blue: '#6699FF',
    red: '#F44336',
    yellow: '#FFC107',
    green: '#4CAF50',
    teal: '#009688',
    pink: '#EC407A',
  };
  return hexMap[color];
};

const rgbToHex = (rgb: string): string => {
  const match = rgb.match(/\d+/g);
  if (!match || match.length < 3) return '#FF6B55';
  
  const r = parseInt(match[0]);
  const g = parseInt(match[1]);
  const b = parseInt(match[2]);
  
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
};

const findClosestAccentColor = (hex: string): AccentColor => {
  const validColors: AccentColor[] = ['orange', 'purple', 'blue', 'red', 'yellow', 'green', 'teal', 'pink'];
  
  for (const color of validColors) {
    if (accentColorToHex(color).toUpperCase() === hex.toUpperCase()) {
      return color;
    }
  }
  
  return hexToAccentColor(hex);
};

const [ThemeProviderRaw, useTheme] = createContextHook(() => {
  const { user, updateProfile, isLoading: userLoading } = useUser();
  const [accentColor, setAccentColorState] = useState<AccentColor>('orange');
  const [isLoading, setIsLoading] = useState(true);
  const hasMigratedRef = useRef(false);
  
  // Use ref for updateProfile to prevent infinite re-renders
  const updateProfileRef = useRef(updateProfile);
  useEffect(() => {
    updateProfileRef.current = updateProfile;
  }, [updateProfile]);

  const loadAccentColor = useCallback(async () => {
    logger.debug('[ThemeContext] Loading accent color...');
    logger.debug('[ThemeContext] User loading:', userLoading);
    logger.debug('[ThemeContext] User:', user ? { id: user.id, accentColor: user.accentColor } : 'null');
    
    try {
      const validColors: AccentColor[] = ['orange', 'purple', 'blue', 'red', 'yellow', 'green', 'teal', 'pink'];
      
      if (user?.accentColor) {
        logger.debug('[ThemeContext] Found database color:', user.accentColor);
        const color = findClosestAccentColor(user.accentColor);
        logger.debug('[ThemeContext] Mapped to accent color:', color);
        setAccentColorState(color);
        
        await AsyncStorage.setItem(THEME_STORAGE_KEY, color);
        logger.debug('[ThemeContext] Synced to AsyncStorage');
      } else if (user && !hasMigratedRef.current) {
        logger.debug('[ThemeContext] No database color, checking AsyncStorage for migration...');
        hasMigratedRef.current = true;
        
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        logger.debug('[ThemeContext] AsyncStorage value:', stored);
        
        if (stored && validColors.includes(stored as AccentColor)) {
          const color = stored as AccentColor;
          logger.debug('[ThemeContext] Migrating AsyncStorage color to database:', color);
          
          setAccentColorState(color);
          
          const hexColor = accentColorToHex(color);
          // Use ref to access current updateProfile without causing re-renders
          const result = await updateProfileRef.current({ accentColor: hexColor });
          
          if (result.success) {
            logger.debug('[ThemeContext] Migration successful');
          } else {
            logger.error('[ThemeContext] Migration failed:', result.error);
          }
        } else {
          logger.debug('[ThemeContext] No AsyncStorage color, using default');
          setAccentColorState('orange');
        }
      } else if (!user) {
        logger.debug('[ThemeContext] No user, checking AsyncStorage...');
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        
        if (stored && validColors.includes(stored as AccentColor)) {
          logger.debug('[ThemeContext] Using AsyncStorage color:', stored);
          setAccentColorState(stored as AccentColor);
        } else {
          logger.debug('[ThemeContext] No stored color, using default');
          setAccentColorState('orange');
        }
      }
    } catch (error) {
      logger.error('[ThemeContext] Failed to load accent color:', error);
      setAccentColorState('orange');
    } finally {
      setIsLoading(false);
    }
  }, [user, userLoading]); // Removed updateProfile - using ref instead

  useEffect(() => {
    loadAccentColor();
  }, [loadAccentColor]);

  const setAccentColor = useCallback(async (color: AccentColor) => {
    logger.debug('[ThemeContext] Setting accent color:', color);
    
    try {
      setAccentColorState(color);
      
      await AsyncStorage.setItem(THEME_STORAGE_KEY, color);
      logger.debug('[ThemeContext] Saved to AsyncStorage');
      
      if (user) {
        const hexColor = accentColorToHex(color);
        logger.debug('[ThemeContext] Saving to database:', hexColor);
        
        // Use ref to access current updateProfile without causing re-renders
        const result = await updateProfileRef.current({ accentColor: hexColor });
        
        if (result.success) {
          logger.debug('[ThemeContext] Database sync successful');
        } else {
          logger.error('[ThemeContext] Database sync failed:', result.error);
        }
      } else {
        logger.debug('[ThemeContext] No user, skipping database sync');
      }
    } catch (error) {
      logger.error('[ThemeContext] Failed to save accent color:', error);
    }
  }, [user]); // Removed updateProfile - using ref instead

  const accent = COLORS.accents[accentColor];
  const accentHex = useMemo(() => accent.toUpperCase(), [accent]);

  return useMemo(() => ({
    accentColor,
    accent: accent.toUpperCase(),
    accentHex,
    setAccentColor,
    isLoading: isLoading || userLoading,
  }), [accentColor, accent, accentHex, setAccentColor, isLoading, userLoading]);
});

// Wrap provider with React.memo to prevent unnecessary re-renders
// when UserContext updates but relevant values haven't changed
export const ThemeProvider = React.memo(ThemeProviderRaw);

export { useTheme };
