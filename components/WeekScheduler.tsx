import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Platform } from 'react-native';
import { Check, Plus } from 'lucide-react-native';
import SessionSelectorModal, { Session } from './SessionSelectorModal';
import { COLORS, SPACING } from '@/constants/theme';
import { useSchedule } from '@/contexts/ScheduleContext';

type WeekSchedulerProps = {
  sessions: Session[];
  accentColor: string;
  currentWeek: number;
  programmeWeeks: number;
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function WeekScheduler({
  sessions,
  accentColor,
  currentWeek,
  programmeWeeks,
}: WeekSchedulerProps) {
  const { schedule, assignSession } = useSchedule();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  const currentWeekSessions = useMemo(() => {
    return sessions.filter(s => s.week === currentWeek + 1);
  }, [sessions, currentWeek]);

  const getSessionForDay = (dayIndex: number): Session | null => {
    const daySchedule = schedule[dayIndex];
    if (!daySchedule?.sessionId) return null;

    return currentWeekSessions.find(s => s.id === daySchedule.sessionId) || null;
  };

  const getScheduledSessionIds = useMemo(() => {
    return schedule
      .filter(day => day.sessionId && day.status !== 'empty')
      .map(day => day.sessionId)
      .filter((id): id is string => id !== null && id !== undefined);
  }, [schedule]);

  const handleDayPress = (dayIndex: number) => {
    const daySchedule = schedule[dayIndex];
    if (daySchedule?.status === 'completed') {
      return;
    }
    setSelectedDay(dayIndex);
    setShowModal(true);
  };

  const handleSessionSelect = async (session: Session | null) => {
    if (selectedDay === null) return;
    await assignSession(selectedDay, session?.id || null);
  };

  const getDayStatus = (dayIndex: number) => {
    const daySchedule = schedule[dayIndex];
    if (!daySchedule) return 'empty';
    return daySchedule.status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return accentColor;
      case 'completed':
        return '#10b981';
      case 'rest':
        return COLORS.textSecondary;
      default:
        return COLORS.cardBorder;
    }
  };

  const getStatusBackground = (status: string) => {
    switch (status) {
      case 'scheduled':
        return `${accentColor}15`;
      case 'completed':
        return '#10b98120';
      case 'rest':
        return COLORS.cardBackground;
      default:
        return 'transparent';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Week {currentWeek + 1} Schedule</Text>
        <Text style={styles.subtitle}>Tap to assign sessions</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysContainer}
      >
        {DAYS.map((day, index) => {
          const status = getDayStatus(index);
          const session = getSessionForDay(index);
          const isCompleted = status === 'completed';
          const hasSession = status === 'scheduled' || status === 'completed';

          return (
            <Pressable
              key={index}
              onPress={() => handleDayPress(index)}
              style={({ pressed }) => [
                styles.dayCard,
                {
                  backgroundColor: getStatusBackground(status),
                  borderColor: getStatusColor(status),
                },
                pressed && !isCompleted && styles.dayCardPressed,
                isCompleted && styles.dayCardCompleted,
              ]}
              disabled={isCompleted}
            >
              <View style={styles.dayHeader}>
                <Text
                  style={[
                    styles.dayLabel,
                    hasSession && { color: getStatusColor(status) },
                  ]}
                >
                  {day}
                </Text>
                {isCompleted && (
                  <View style={[styles.completeBadge, { backgroundColor: '#10b981' }]}>
                    <Check size={12} color={COLORS.background} strokeWidth={3} />
                  </View>
                )}
              </View>

              <View style={styles.dayContent}>
                {hasSession && session ? (
                  <>
                    <Text
                      style={[
                        styles.sessionName,
                        { color: getStatusColor(status) },
                      ]}
                      numberOfLines={2}
                    >
                      {session.name}
                    </Text>
                    <Text style={styles.exerciseCount}>
                      {session.exercises.length} exercises
                    </Text>
                  </>
                ) : status === 'rest' ? (
                  <View style={styles.restIndicator}>
                    <Text style={styles.restText}>Rest</Text>
                  </View>
                ) : (
                  <View style={styles.emptyIndicator}>
                    <Plus size={24} color={COLORS.textTertiary} strokeWidth={2} />
                    <Text style={styles.emptyText}>Assign</Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: accentColor }]} />
          <Text style={styles.legendText}>Scheduled</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
          <Text style={styles.legendText}>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.textSecondary }]} />
          <Text style={styles.legendText}>Rest</Text>
        </View>
      </View>

      {selectedDay !== null && (
        <SessionSelectorModal
          visible={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedDay(null);
          }}
          onSelect={handleSessionSelect}
          sessions={currentWeekSessions}
          scheduledSessionIds={getScheduledSessionIds}
          selectedSessionId={schedule[selectedDay]?.sessionId || null}
          dayName={DAYS_FULL[selectedDay]}
          accentColor={accentColor}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
  },
  header: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  daysContainer: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  dayCard: {
    width: 130,
    minHeight: 140,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  dayCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  dayCardCompleted: {
    opacity: 0.85,
  },
  dayHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: SPACING.sm,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: COLORS.textSecondary,
  },
  completeBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  dayContent: {
    flex: 1,
    justifyContent: 'center' as const,
  },
  sessionName: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  exerciseCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  restIndicator: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  restText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.textSecondary,
  },
  emptyIndicator: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 4,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontWeight: '500' as const,
  },
  legend: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: SPACING.lg,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  legendItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500' as const,
  },
});
