import { User } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';

import { COLORS, SPACING } from '@/constants/theme';

type DashboardHeaderProps = {
  accent: string;
  level: number;
  onProfilePress: () => void;
};

export default function DashboardHeader({
  accent,
  level,
  onProfilePress,
}: DashboardHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <View>
          <Text style={styles.brandText}>FORM</Text>
          <Text style={styles.brandSubtitle}>POWERED BY OJ GYMS</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <View style={[styles.lvlBadge, { borderColor: accent }]}>
          <Text style={styles.lvlText}>LVL {level}</Text>
        </View>
        <Pressable
          onPress={onProfilePress}
          style={styles.profileButton}
          hitSlop={8}
        >
          <User size={22} color={COLORS.textSecondary} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    height: 48,
    marginBottom: SPACING.md,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
brandText: {
    fontSize: 20,
    fontWeight: '800',
    fontStyle: 'italic',
    color: COLORS.textPrimary,
    letterSpacing: 1.5,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textTertiary,
    letterSpacing: 1.5,
    marginTop: -1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  lvlBadge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  lvlText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: COLORS.textPrimary,
  },
  profileButton: {
    padding: SPACING.xs,
  },
});
