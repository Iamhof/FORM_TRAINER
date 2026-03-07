import React, { useMemo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';

import { COLORS, SPACING, colorWithOpacity } from '@/constants/theme';

import type { DayStatus } from '@/contexts/ScheduleContext';
import type { WeekDateEntry } from '@/lib/date-utils';

type ScheduleDay = {
  dayOfWeek: number;
  status: DayStatus;
  sessionId?: string | null;
  weekStart: string;
};

type DashboardWeekStripProps = {
  schedule: ScheduleDay[];
  accent: string;
  weekDates: WeekDateEntry[];
  scheduledCount: number;
  targetCount: number;
  onToggleDay?: (dayIndex: number) => void;
  canScheduleMore?: boolean;
};

const COMPLETED_COLOR = '#10b981';

function getTodayIndex(): number {
  const jsDay = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  return jsDay === 0 ? 6 : jsDay - 1; // Convert to Mon=0...Sun=6
}

function DashboardWeekStrip({
  schedule,
  accent,
  weekDates,
  scheduledCount,
  targetCount,
  onToggleDay,
  canScheduleMore = false,
}: DashboardWeekStripProps) {
  const todayIndex = useMemo(() => getTodayIndex(), []);

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>SCHEDULE</Text>
        <Text style={[styles.headerCount, { color: accent }]}>
          {scheduledCount} / {targetCount} PLANNED
        </Text>
      </View>

      {/* Day Chips */}
      <View style={styles.daysRow}>
        {weekDates.map((dateEntry, index) => {
          const daySchedule = schedule[index];
          const status: DayStatus = daySchedule?.status || 'empty';
          const isActive = status === 'scheduled' || status === 'completed';
          const isToday = index === todayIndex;
          const isTodayActive = isToday && isActive;

          // Determine colors based on state
          let chipBg: string;
          let chipBorder: string;
          let textColor: string;

          if (isTodayActive) {
            // Today + scheduled/completed = inverted white chip
            chipBg = '#FFFFFF';
            chipBorder = '#FFFFFF';
            textColor = '#000000';
          } else if (status === 'completed') {
            chipBg = colorWithOpacity(COMPLETED_COLOR, 0.15);
            chipBorder = COMPLETED_COLOR;
            textColor = COLORS.textPrimary;
          } else if (status === 'scheduled') {
            chipBg = colorWithOpacity(accent, 0.15);
            chipBorder = accent;
            textColor = COLORS.textPrimary;
          } else {
            // Empty
            chipBg = 'rgba(255, 255, 255, 0.04)';
            chipBorder = 'rgba(255, 255, 255, 0.08)';
            textColor = COLORS.textTertiary;
          }

          const canTap = onToggleDay && (canScheduleMore || isActive);

          return (
            <Pressable
              key={index}
              style={styles.chipWrapper}
              onPress={canTap ? () => onToggleDay(index) : undefined}
              disabled={!canTap}
            >
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: chipBg,
                    borderColor: chipBorder,
                  },
                ]}
              >
                <Text style={[styles.chipDayText, { color: textColor }]}>
                  {dateEntry.dayAbbr.toUpperCase()}
                </Text>
                <Text style={[styles.chipDateText, { color: textColor }]}>
                  {String(dateEntry.dateNumber).padStart(2, '0')}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default React.memo(DashboardWeekStrip);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 2,
  },
  headerCount: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chipWrapper: {
    alignItems: 'center',
  },
  chip: {
    width: 42,
    height: 76,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  chipDayText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  chipDateText: {
    fontSize: 18,
    fontWeight: '800',
    fontStyle: 'italic',
  },
});
