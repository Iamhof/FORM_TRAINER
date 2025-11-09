import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Home, Dumbbell, BarChart3, Trophy, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, BOTTOM_NAV_HEIGHT } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type TabItem = {
  name: string;
  label: string;
  icon: typeof Home;
};

const TABS: TabItem[] = [
  { name: 'home', label: 'Home', icon: Home },
  { name: 'workouts', label: 'Workouts', icon: Dumbbell },
  { name: 'analytics', label: 'Progress', icon: BarChart3 },
  { name: 'leaderboard', label: 'Ranks', icon: Trophy },
  { name: 'profile', label: 'Profile', icon: User },
];

type BottomNavProps = {
  currentRoute: string;
  onNavigate: (route: string) => void;
};

export default function BottomNav({ currentRoute, onNavigate }: BottomNavProps) {
  const { accent } = useTheme();
  const insets = useSafeAreaInsets();



  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={80} tint="dark" style={styles.blur}>
          <View style={[styles.content, { paddingBottom: insets.bottom }]}>
            {TABS.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = tab.name === currentRoute;
              
              return (
                <Pressable
                  key={tab.name}
                  onPress={() => onNavigate(tab.name)}
                  style={styles.tab}
                  testID={`tab-${tab.name}`}
                >
                  <Icon
                    size={24}
                    color={isActive ? accent : COLORS.textSecondary}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <Text
                    style={[
                      styles.label,
                      { color: isActive ? accent : COLORS.textSecondary },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </BlurView>
      ) : (
        <View style={[styles.blur, styles.webBlur]}>
          <View style={[styles.content, { paddingBottom: insets.bottom }]}>
            {TABS.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = tab.name === currentRoute;
              
              return (
                <Pressable
                  key={tab.name}
                  onPress={() => onNavigate(tab.name)}
                  style={styles.tab}
                  testID={`tab-${tab.name}`}
                >
                  <Icon
                    size={24}
                    color={isActive ? accent : COLORS.textSecondary}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <Text
                    style={[
                      styles.label,
                      { color: isActive ? accent : COLORS.textSecondary },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.8), 0 -2px 8px rgba(0, 0, 0, 0.6)',
      },
    }),
  },
  blur: {
    overflow: 'hidden',
    borderTopWidth: 2,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  webBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    borderTopWidth: 2,
    borderTopColor: 'rgba(255, 255, 255, 0.18)',
  },
  content: {
    flexDirection: 'row',
    minHeight: BOTTOM_NAV_HEIGHT,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
});
