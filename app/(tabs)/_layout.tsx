import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import BottomNav from '@/components/BottomNav';
import { COLORS } from '@/constants/theme';

export default function TabLayout() {
  const router = useRouter();
  const segments = useSegments();
  
  const currentRoute = segments[segments.length - 1] || 'home';

  const handleNavigate = (route: string) => {
    if (route === 'exercises') {
      router.push('/exercises');
    } else {
      router.push(`/(tabs)/${route}` as any);
    }
  };

  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="home" />
        <Stack.Screen name="workouts" />
        <Stack.Screen name="analytics" />
        <Stack.Screen name="progress" />
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
