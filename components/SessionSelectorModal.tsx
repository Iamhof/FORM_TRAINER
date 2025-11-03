import React, { useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  ScrollView,
  Dimensions,
  PanResponder,
} from 'react-native';
import { X, Check } from 'lucide-react-native';

import { COLORS, SPACING } from '@/constants/theme';

export type Session = {
  id: string;
  name: string;
  day: number;
  week: number;
  exercises: { name: string; sets: number; reps: string }[];
  dayBadge: string;
};

type SessionSelectorModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (session: Session | null) => void;
  sessions: Session[];
  scheduledSessionIds?: string[];
  selectedSessionId: string | null;
  dayName: string;
  accentColor: string;
  dayIndex: number;
  onDayChange: (newDayIndex: number) => void;
};

export default function SessionSelectorModal({
  visible,
  onClose,
  onSelect,
  sessions,
  scheduledSessionIds = [],
  selectedSessionId,
  dayName,
  accentColor,
  dayIndex,
  onDayChange,
}: SessionSelectorModalProps) {
  const SWIPE_THRESHOLD = 50;
  const canScrollBack = dayIndex > 0;
  const canScrollForward = dayIndex < 6;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD && canScrollBack) {
          onDayChange(dayIndex - 1);
        } else if (gestureState.dx < -SWIPE_THRESHOLD && canScrollForward) {
          onDayChange(dayIndex + 1);
        }
      },
    })
  ).current;

  console.log('[SessionSelectorModal] Rendered with:', {
    visible,
    sessionsCount: sessions.length,
    dayName,
    selectedSessionId,
    scheduledSessionIds,
    dayIndex,
  });

  const availableSessions = sessions.filter(
    (session) => session.id === selectedSessionId || !scheduledSessionIds.includes(session.id)
  );

  console.log('[SessionSelectorModal] Available sessions:', availableSessions.length);

  const handleSelect = (session: Session | null) => {
    console.log('[SessionSelectorModal] Selecting session:', session?.id);
    onSelect(session);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header} {...panResponder.panHandlers}>
            <View style={styles.swipeContainer}>
              <View style={styles.swipeHandle} />
            </View>
            <View style={styles.closeContainer}>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <X size={24} color={COLORS.textPrimary} strokeWidth={2} />
              </Pressable>
            </View>
            <View style={styles.headerContent}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Choose Session</Text>
                <Text style={styles.subtitle}>{dayName}</Text>
              </View>
              <View style={styles.dayNavigator}>
                <Pressable
                  style={[styles.navButton, !canScrollBack && styles.navButtonDisabled]}
                  onPress={() => canScrollBack && onDayChange(dayIndex - 1)}
                  disabled={!canScrollBack}
                >
                  <Text style={[styles.navText, !canScrollBack && styles.navTextDisabled]}>←</Text>
                </Pressable>
                <Text style={styles.dayIndicator}>
                  {dayIndex + 1}/7
                </Text>
                <Pressable
                  style={[styles.navButton, !canScrollForward && styles.navButtonDisabled]}
                  onPress={() => canScrollForward && onDayChange(dayIndex + 1)}
                  disabled={!canScrollForward}
                >
                  <Text style={[styles.navText, !canScrollForward && styles.navTextDisabled]}>→</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Pressable
              style={[
                styles.restOption,
                selectedSessionId === null && { 
                  backgroundColor: `${accentColor}15`,
                  borderColor: accentColor,
                },
              ]}
              onPress={() => handleSelect(null)}
            >
              <View style={styles.restContent}>
                <Text style={[
                  styles.restText,
                  selectedSessionId === null && { color: accentColor },
                ]}>
                  Rest Day
                </Text>
                {selectedSessionId === null && (
                  <View style={[styles.checkmark, { backgroundColor: accentColor }]}>
                    <Check size={16} color={COLORS.background} strokeWidth={3} />
                  </View>
                )}
              </View>
            </Pressable>

            {sessions.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No sessions available for this week
                </Text>
              </View>
            )}

            {sessions.length > 0 && availableSessions.length === 0 && selectedSessionId === null && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  All sessions are already scheduled.{"\n"}
                  Tap &quot;Rest Day&quot; to unassign this day.
                </Text>
              </View>
            )}

            {availableSessions.map((session) => {
              const isSelected = session.id === selectedSessionId;
              return (
                <Pressable
                  key={session.id}
                  onPress={() => handleSelect(session)}
                >
                  <View
                    style={[
                      styles.sessionCard,
                      isSelected && {
                        backgroundColor: accentColor,
                        borderColor: accentColor,
                      },
                    ]}
                  >
                    <View style={styles.sessionHeader}>
                      <View style={styles.sessionInfoContainer}>
                        <View style={styles.sessionTitleRow}>
                          <Text style={[
                            styles.sessionName,
                            isSelected && { color: '#FFFFFF' },
                          ]}>
                            {session.name}
                          </Text>
                          {isSelected && (
                            <View style={[styles.checkmark, { backgroundColor: '#FFFFFF' }]}>
                              <Check size={18} color={accentColor} strokeWidth={3} />
                            </View>
                          )}
                        </View>
                        <Text style={[
                          styles.exerciseCount,
                          isSelected && { color: 'rgba(255, 255, 255, 0.8)' },
                        ]}>
                          {session.exercises.length} {session.exercises.length === 1 ? 'exercise' : 'exercises'}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.dayBadge,
                          { backgroundColor: isSelected ? '#FFFFFF' : `${accentColor}30` },
                        ]}
                      >
                        <Text style={[styles.dayBadgeText, { color: isSelected ? accentColor : accentColor }]}>
                          {session.dayBadge}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.divider, isSelected && { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]} />

                    <View style={styles.exerciseList}>
                      {session.exercises.slice(0, 3).map((exercise, idx) => (
                        <View key={idx} style={styles.exerciseRow}>
                          <Text style={[
                            styles.exerciseName,
                            isSelected && { color: '#FFFFFF' },
                          ]} numberOfLines={1}>
                            • {exercise.name}
                          </Text>
                          <Text style={[
                            styles.exerciseSets,
                            isSelected && { 
                              color: accentColor,
                              backgroundColor: '#FFFFFF',
                            },
                          ]}>
                            {exercise.sets} × {exercise.reps}
                          </Text>
                        </View>
                      ))}
                      {session.exercises.length > 3 && (
                        <Text style={[
                          styles.moreExercises,
                          isSelected && { color: 'rgba(255, 255, 255, 0.7)' },
                        ]}>
                          +{session.exercises.length - 3} more exercises
                        </Text>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end' as const,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
    minHeight: height * 0.5,
    paddingTop: SPACING.lg,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  swipeContainer: {
    alignItems: 'center' as const,
    paddingVertical: 8,
    marginBottom: 8,
  },
  swipeHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerContent: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginTop: SPACING.md,
  },
  titleContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  closeContainer: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    zIndex: 10,
  },
  dayNavigator: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  navButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  navButtonDisabled: {
    backgroundColor: 'transparent',
    opacity: 0.3,
  },
  navText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
  },
  navTextDisabled: {
    color: COLORS.textSecondary,
  },
  dayIndicator: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: COLORS.textSecondary,
    minWidth: 30,
    textAlign: 'center' as const,
  },
  title: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: COLORS.textPrimary,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '600' as const,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cardBackground,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  scrollView: {
    flex: 1,
    maxHeight: height * 0.65,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl + 40,
    flexGrow: 1,
  },
  restOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  restContent: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  restText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
  },
  sessionCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 16,
  },
  sessionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: SPACING.md,
  },
  sessionInfoContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  sessionTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: SPACING.sm,
    marginBottom: 4,
  },
  sessionName: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: COLORS.textPrimary,
    flex: 1,
    letterSpacing: 0.2,
  },
  dayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    minWidth: 60,
    alignItems: 'center' as const,
  },
  dayBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  exerciseCount: {
    fontSize: 14,
    color: COLORS.textTertiary,
    fontWeight: '600' as const,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: SPACING.md,
  },
  exerciseList: {
    gap: 10,
  },
  exerciseRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    gap: SPACING.sm,
  },
  exerciseName: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '600' as const,
    flex: 1,
  },
  exerciseSets: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '700' as const,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  moreExercises: {
    fontSize: 13,
    color: COLORS.textTertiary,
    fontWeight: '600' as const,
    marginTop: 4,
    fontStyle: 'italic' as const,
  },
  emptyState: {
    paddingVertical: SPACING.xl * 2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  emptyStateText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
  },
});
