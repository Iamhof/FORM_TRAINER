import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import Card from './Card';
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
}: SessionSelectorModalProps) {
  const availableSessions = sessions.filter(
    (session) => session.id === selectedSessionId || !scheduledSessionIds.includes(session.id)
  );

  const handleSelect = (session: Session | null) => {
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
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Choose Session</Text>
              <Text style={styles.subtitle}>{dayName}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={24} color={COLORS.textPrimary} strokeWidth={2} />
            </Pressable>
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
                  <Card
                    style={[
                      styles.sessionCard,
                      isSelected && {
                        backgroundColor: `${accentColor}10`,
                        borderColor: accentColor,
                        borderWidth: 2,
                      },
                    ]}
                  >
                    <View style={styles.sessionHeader}>
                      <View style={styles.sessionInfoContainer}>
                        <View style={styles.sessionTitleRow}>
                          <Text style={[
                            styles.sessionName,
                            isSelected && { color: accentColor },
                          ]}>
                            {session.name}
                          </Text>
                          {isSelected && (
                            <View style={[styles.checkmark, { backgroundColor: accentColor }]}>
                              <Check size={18} color={COLORS.background} strokeWidth={3} />
                            </View>
                          )}
                        </View>
                        <Text style={styles.exerciseCount}>
                          {session.exercises.length} {session.exercises.length === 1 ? 'exercise' : 'exercises'}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.dayBadge,
                          { backgroundColor: isSelected ? accentColor : `${accentColor}30` },
                        ]}
                      >
                        <Text style={[styles.dayBadgeText, { color: isSelected ? COLORS.background : accentColor }]}>
                          {session.dayBadge}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.exerciseList}>
                      {session.exercises.slice(0, 3).map((exercise, idx) => (
                        <View key={idx} style={styles.exerciseRow}>
                          <Text style={styles.exerciseName} numberOfLines={1}>
                            • {exercise.name}
                          </Text>
                          <Text style={styles.exerciseSets}>
                            {exercise.sets} × {exercise.reps}
                          </Text>
                        </View>
                      ))}
                      {session.exercises.length > 3 && (
                        <Text style={styles.moreExercises}>
                          +{session.exercises.length - 3} more exercises
                        </Text>
                      )}
                    </View>
                  </Card>
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
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
    paddingTop: SPACING.lg,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
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
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl + 20,
  },
  restOption: {
    backgroundColor: COLORS.cardBackground,
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
