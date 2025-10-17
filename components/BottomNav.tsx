import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Home, Dumbbell, BarChart3, TrendingUp, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type TabItem = {
  name: string;
  label: string;
  icon: typeof Home;
};

const TABS: TabItem[] = [
  { name: 'home', label: 'Home', icon: Home },
  { name: 'workouts', label: 'Workouts', icon: Dumbbell },
  { name: 'analytics', label: 'Analytics', icon: BarChart3 },
  { name: 'progress', label: 'Progress', icon: TrendingUp },
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
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={80} tint="dark" style={styles.blur}>
          <View style={styles.content}>
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
          <View style={styles.content}>
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  blur: {
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'transparent',
  },
  webBlur: {
    backgroundColor: 'rgba(18, 18, 18, 0.75)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  content: {
    flexDirection: 'row',
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
});
