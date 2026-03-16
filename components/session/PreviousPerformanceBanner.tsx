import { Clock, Trophy } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import Card from '@/components/Card';
import { COLORS, SPACING } from '@/constants/theme';

interface PreviousPerformanceBannerProps {
  lastSets: { weight: number; reps: number }[] | null;
  timeAgo: string;
  pr: { weight: number; reps: number } | null;
  isLoading: boolean;
  accent: string;
}

export function PreviousPerformanceBanner({
  lastSets,
  timeAgo,
  pr,
  isLoading,
  accent,
}: PreviousPerformanceBannerProps) {
  if (isLoading) {
    return (
      <Card style={styles.card}>
        <ActivityIndicator size="small" color={COLORS.textTertiary} />
      </Card>
    );
  }

  if (!lastSets || lastSets.length === 0) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Clock size={14} color={COLORS.textSecondary} />
          <Text style={styles.headerText}>Last time</Text>
        </View>
        <Text style={styles.timeAgoText}>{timeAgo}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
        {lastSets.map((set, index) => (
          <View key={index} style={styles.chip}>
            <Text style={styles.chipText}>
              {set.weight}kg {'\u00D7'} {set.reps}
            </Text>
          </View>
        ))}
      </ScrollView>

      {pr ? (
        <View style={styles.prRow}>
          <Trophy size={14} color={accent} />
          <Text style={[styles.prText, { color: accent }]}>
            PR: {pr.weight}kg {'\u00D7'} {pr.reps}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  headerText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  timeAgoText: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  prText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
