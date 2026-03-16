import * as Haptics from 'expo-haptics';
import { Lock } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, SPACING } from '@/constants/theme';

interface ProFeatureTeaserProps {
  onUpgrade: () => void;
  accent: string;
}

export function ProFeatureTeaser({ onUpgrade, accent }: ProFeatureTeaserProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUpgrade();
  };

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      <View style={styles.row}>
        <Lock size={14} color={COLORS.textTertiary} />
        <Text style={styles.label}>Smart suggestions</Text>
        <View style={[styles.badge, { backgroundColor: accent }]}>
          <Text style={styles.badgeText}>PRO</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  label: {
    fontSize: 13,
    color: COLORS.textTertiary,
  },
  badge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});
