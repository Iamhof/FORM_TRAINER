import { BlurView } from 'expo-blur';
import { LayoutGrid, Dumbbell, BarChart3, Trophy } from 'lucide-react-native';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, SPACING, BOTTOM_NAV_HEIGHT } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type TabItem = {
  name: string;
  label: string;
  icon: typeof LayoutGrid;
};

const TABS: TabItem[] = [
  { name: 'home', label: 'DASHBOARD', icon: LayoutGrid },
  { name: 'workouts', label: 'WORKOUTS', icon: Dumbbell },
  { name: 'analytics', label: 'STATS', icon: BarChart3 },
  { name: 'leaderboard', label: 'RANKS', icon: Trophy },
];

type BottomNavProps = {
  currentRoute: string;
  onNavigate: (route: string) => void;
};

function TabButton({
  tab,
  isActive,
  accent,
  onPress,
}: {
  tab: TabItem;
  isActive: boolean;
  accent: string;
  onPress: () => void;
}) {
  const Icon = tab.icon;

  return (
    <Pressable
      onPress={onPress}
      style={styles.tab}
      testID={`tab-${tab.name}`}
    >
      <Icon
        size={24}
        color={isActive ? accent : COLORS.textTertiary}
        strokeWidth={isActive ? 2.5 : 2}
      />
      <Text
        style={[
          styles.label,
          { color: isActive ? accent : COLORS.textTertiary },
        ]}
      >
        {tab.label}
      </Text>
    </Pressable>
  );
}

export default function BottomNav({ currentRoute, onNavigate }: BottomNavProps) {
  const { accent } = useTheme();
  const insets = useSafeAreaInsets();

  const renderTabs = () =>
    TABS.map((tab) => (
      <TabButton
        key={tab.name}
        tab={tab}
        isActive={tab.name === currentRoute}
        accent={accent}
        onPress={() => onNavigate(tab.name)}
      />
    ));

  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={60} tint="dark" style={styles.blur}>
          <View style={[styles.content, { paddingBottom: insets.bottom }]}>
            {renderTabs()}
          </View>
        </BlurView>
      ) : (
        <View style={[styles.blur, styles.webBlur]}>
          <View style={[styles.content, { paddingBottom: insets.bottom }]}>
            {renderTabs()}
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
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  webBlur: Platform.select({
    web: {
      backgroundColor: 'rgba(8, 8, 10, 0.92)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderTopWidth: 0.5,
      borderTopColor: 'rgba(255, 255, 255, 0.06)',
    } as any,
    default: {
      backgroundColor: 'rgba(8, 8, 10, 0.92)',
      borderTopWidth: 0.5,
      borderTopColor: 'rgba(255, 255, 255, 0.06)',
    },
  }),
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
    gap: 4,
  },
label: {
    fontSize: 10,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
});
