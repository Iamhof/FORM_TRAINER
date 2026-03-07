import { Play } from 'lucide-react-native';
import React from 'react';
import { Platform, StyleSheet, Text, View, Pressable } from 'react-native';

import GlowCard from '@/components/GlowCard';
import { COLORS, SPACING, TYPOGRAPHY, colorWithOpacity } from '@/constants/theme';

import type { Programme } from '@/contexts/ProgrammeContext';

type ActiveProgrammeCardProps = {
  programme: Programme;
  accent: string;
  progress: { completed: number; total: number; percentage: number };
  currentWeekAndDay: { currentWeek: number; currentDay: number; totalWeeks: number };
  nextSession: { week: number; day: number; sessionId: string } | null;
  onPress: () => void;
  onNextSession: (sessionId: string) => void;
};

function ActiveProgrammeCard({
  programme,
  accent,
  progress,
  currentWeekAndDay,
  nextSession,
  onPress,
  onNextSession,
}: ActiveProgrammeCardProps) {
  const { currentWeek, currentDay, totalWeeks } = currentWeekAndDay;
  const { percentage } = progress;
  const isComplete = !nextSession && percentage === 100;

  return (
    <GlowCard glowColor={accent} intensity="high">
      <Pressable onPress={onPress} style={styles.cardInner}>
        {/* Row 1: Category pill + ACTIVE badge */}
        <View style={styles.topRow}>
          {programme.category ? (
            <View style={styles.categoryPill}>
              <Text style={styles.categoryText}>
                {programme.category.toUpperCase()}
              </Text>
            </View>
          ) : (
            <View />
          )}
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>ACTIVE</Text>
          </View>
        </View>

        {/* Row 2: Programme name */}
        <Text style={styles.programmeName}>{programme.name}</Text>

        {/* Row 3: Progress label + W/D indicator */}
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>TRAINING PROGRESS</Text>
          <Text style={[styles.progressValue, { color: accent }]}>
            W{currentWeek}/D{currentDay}
            <Text style={styles.progressTotal}> of {totalWeeks}</Text>
          </Text>
        </View>

        {/* Row 4: Thin progress bar */}
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${percentage}%`,
                backgroundColor: accent,
              },
              Platform.select({
                web: {
                  boxShadow: `0 0 8px ${colorWithOpacity(accent, 0.4)}`,
                } as any,
                default: {},
              }),
            ]}
          />
        </View>

        {/* Row 5: NEXT SESSION ghost button or PROGRAMME COMPLETE */}
        {isComplete ? (
          <View style={styles.completeButton}>
            <Text style={styles.completeText}>PROGRAMME COMPLETE</Text>
          </View>
        ) : nextSession ? (
          <Pressable
            onPress={() => onNextSession(nextSession.sessionId)}
            style={[
              styles.nextSessionButton,
              Platform.select({
                web: {
                  boxShadow: 'inset 0 1px 2px rgba(168, 85, 247, 0.1)',
                } as any,
                default: {},
              }),
            ]}
          >
            <Play size={18} color={accent} strokeWidth={2.5} />
            <Text style={styles.nextSessionText}>NEXT SESSION</Text>
          </Pressable>
        ) : null}
      </Pressable>
    </GlowCard>
  );
}

export default React.memo(ActiveProgrammeCard);

const styles = StyleSheet.create({
  cardInner: {
    padding: SPACING.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  categoryPill: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: COLORS.textPrimary,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  activeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.success,
  },
  programmeName: {
    fontSize: TYPOGRAPHY.h1.fontSize,
    fontWeight: TYPOGRAPHY.h1.fontWeight,
    fontStyle: 'italic',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressTotal: {
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 2,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  nextSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderRadius: 14,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: 'transparent',
  },
  nextSessionText: {
    fontSize: TYPOGRAPHY.button.fontSize,
    fontWeight: TYPOGRAPHY.button.fontWeight,
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  completeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: SPACING.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  completeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
});
