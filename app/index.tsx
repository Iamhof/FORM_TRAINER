import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useUser } from '@/contexts/UserContext';
import { logger } from '@/lib/logger';
import { getElapsedTime } from '@/lib/runtime-utils';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useUser();

  useEffect(() => {
    if (isLoading) return;

    const target = isAuthenticated ? 'home' : 'onboarding';
    const elapsed = getElapsedTime();
    logger.info(`[Perf] Navigation: redirecting to ${target} { elapsed: ${elapsed}ms }`);

    SplashScreen.hideAsync();

    if (isAuthenticated) {
      router.replace('/(tabs)/home');
    } else {
      router.replace('/onboarding' as any);
    }
  }, [isLoading, isAuthenticated, router]);

  return null;
}
