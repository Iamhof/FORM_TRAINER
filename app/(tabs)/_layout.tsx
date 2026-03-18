import { Stack, useRouter, useSegments } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';

import BottomNav from '@/components/BottomNav';
import { COLORS } from '@/constants/theme';

export default function TabLayout() {
  const router = useRouter();
  const segments = useSegments();
  
  const currentRoute = React.useMemo(() => {
    if ((segments as string[]).includes('exercises')) return 'exercises';
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
        <Stack.Screen name="exercises" options={{ headerShown: false }} />
        <Stack.Screen name="progress" />
        <Stack.Screen name="analytics" />
        <Stack.Screen name="leaderboard" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="my-pt" />
        <Stack.Screen name="settings" />
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
