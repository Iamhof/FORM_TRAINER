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
  selectedSessionId: string | null;
  dayName: string;
  accentColor: string;
};

export default function SessionSelectorModal({
  visible,
  onClose,
  onSelect,
  sessions,
  selectedSessionId,
  dayName,
  accentColor,
}: SessionSelectorModalProps) {
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

            {sessions.map((session) => {
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
                      <View style={styles.sessionTitleRow}>
                        <Text style={[
                          styles.sessionName,
                          isSelected && { color: accentColor },
                        ]}>
                          {session.name}
                        </Text>
                        {isSelected && (
                          <View style={[styles.checkmark, { backgroundColor: accentColor }]}>
                            <Check size={16} color={COLORS.background} strokeWidth={3} />
                          </View>
                        )}
                      </View>
                      <View
                        style={[
                          styles.dayBadge,
                          { backgroundColor: isSelected ? `${accentColor}30` : `${accentColor}15` },
                        ]}
                      >
                        <Text style={[styles.dayBadgeText, { color: accentColor }]}>
                          {session.dayBadge}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.exerciseCount}>
                      {session.exercises.length} exercises
                    </Text>

                    <View style={styles.exerciseList}>
                      {session.exercises.slice(0, 3).map((exercise, idx) => (
                        <View key={idx} style={styles.exerciseRow}>
                          <Text style={styles.exerciseName} numberOfLines={1}>
                            {exercise.name}
                          </Text>
                          <Text style={styles.exerciseSets}>
                            {exercise.sets} × {exercise.reps}
                          </Text>
                        </View>
                      ))}
                      {session.exercises.length > 3 && (
                        <Text style={styles.moreExercises}>
                          +{session.exercises.length - 3} more
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
    fontSize: 24,
    fontWeight: '800' as const,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500' as const,
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
    marginBottom: SPACING.xs,
  },
  sessionTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: SPACING.sm,
    flex: 1,
  },
  sessionName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
  },
  dayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dayBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  exerciseCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  exerciseList: {
    gap: SPACING.xs,
  },
  exerciseRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  exerciseName: {
    fontSize: 13,
    color: COLORS.textPrimary,
    flex: 1,
  },
  exerciseSets: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500' as const,
  },
  moreExercises: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic' as const,
    marginTop: 2,
  },
});
