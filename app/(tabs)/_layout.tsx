import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import BottomNav from '@/components/BottomNav';
import { COLORS } from '@/constants/theme';

export default function TabLayout() {
  const router = useRouter();
  const segments = useSegments();
  
  const currentRoute = React.useMemo(() => {
    if ((segments as string[]).includes('exercises')) return 'exercises';
    if ((segments as string[]).includes('leaderboard')) return 'leaderboard';
    return (segments[segments.length - 1] as string) || 'home';
  }, [segments]);

  const handleNavigate = (route: string) => {
    router.push(`/(tabs)/${route}` as any);
  };

  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="home" />
        <Stack.Screen name="workouts" />
        <Stack.Screen name="analytics" />
        <Stack.Screen name="exercises" options={{ headerShown: false }} />
        <Stack.Screen name="leaderboard" />
        <Stack.Screen name="profile" />
      </Stack>
      <BottomNav currentRoute={currentRoute} onNavigate={handleNavigate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
