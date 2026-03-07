import { Flame } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Card from '@/components/Card';
import { COLORS, SPACING } from '@/constants/theme';
import { getLevelInfo, getLevelProgress } from '@/constants/xp';

type ProfileLevelCardProps = {
  currentXp: number;
  currentLevel: number;
  accent: string;
};

export default function ProfileLevelCard({
  currentXp,
  currentLevel,
  accent,
}: ProfileLevelCardProps) {
  const levelInfo = getLevelInfo(currentLevel);
  const progress = getLevelProgress(currentXp, currentLevel);
  const isMaxLevel = currentLevel >= 10;

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${accent}20` }]}>
          <Flame size={20} color={accent} strokeWidth={2.5} fill={accent} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.levelLabel}>Level {currentLevel}</Text>
          <Text style={[styles.levelTitle, { color: accent }]}>
            {levelInfo.title}
          </Text>
        </View>
        <View style={[styles.xpBadge, { borderColor: accent }]}>
          <Text style={styles.xpBadgeText}>{currentXp} XP</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress.progressPercent}%`,
                backgroundColor: accent,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {isMaxLevel
            ? 'MAX LEVEL'
            : `${progress.xpIntoLevel} / ${progress.xpNeeded} XP`}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  levelLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  levelTitle: {
    fontSize: 20,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  xpBadge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  xpBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  progressContainer: {
    gap: SPACING.xs,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textTertiary,
    textAlign: 'right',
  },
});
