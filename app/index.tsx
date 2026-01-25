import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Dumbbell } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { useUser } from '@/contexts/UserContext';
import { logger } from '@/lib/logger';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useUser();
  const [error, setError] = useState<string | null>(null);

  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        Animated.timing(screenOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          try {
            if (isAuthenticated) {
              router.replace('/(tabs)/home');
            } else {
              router.replace('/onboarding' as any);
            }
          } catch (err) {
            logger.error('[Splash] Navigation error:', err);
            setError('Failed to navigate. Please restart the app.');
          }
        });
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, router, screenOpacity]);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
          alignItems: 'center',
        }}
      >
        <Dumbbell size={80} color={COLORS.textPrimary} strokeWidth={2} />
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.textSecondary} style={styles.loader} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  loader: {
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    marginTop: 24,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    textAlign: 'center' as const,
  },
});
