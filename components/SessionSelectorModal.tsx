import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  ScrollView,
  Dimensions,
  PanResponder,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { X, Check } from 'lucide-react-native';

import { COLORS, SPACING } from '@/constants/theme';
import { logger } from '@/lib/logger';

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
  const HORIZONTAL_SWIPE_THRESHOLD = 50;
  const VERTICAL_SWIPE_THRESHOLD = 100;
  const canScrollBack = dayIndex > 0;
  const canScrollForward = dayIndex < 6;
  
  const [translateY] = useState(new Animated.Value(0));
  const dragY = useRef(0);
  // Loading state to prevent duplicate requests and show feedback
  const [isLoading, setIsLoading] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      // Don't claim touches immediately - let ScrollView handle them by default
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture gestures that are clearly intentional swipes
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
        const isVerticalSwipe = Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.5;
        
        // Increased threshold to require more deliberate gestures (was 10, now 20)
        const hasSignificantMovement = Math.abs(gestureState.dx) > 20 || Math.abs(gestureState.dy) > 20;
        
        // Only capture if it's a clear directional swipe with significant movement
        const shouldCapture = (isHorizontalSwipe || isVerticalSwipe) && hasSignificantMovement;
        
        logger.debug('[SessionSelectorModal] Move detected:', {
          dx: gestureState.dx,
          dy: gestureState.dy,
          isHorizontal: isHorizontalSwipe,
          isVertical: isVerticalSwipe,
          hasSignificantMovement,
          shouldCapture,
        });
        
        return shouldCapture;
      },
      onPanResponderGrant: () => {
        logger.debug('[SessionSelectorModal] Pan gesture started');
      },
      onPanResponderMove: (_, gestureState) => {
        // Only update translateY for downward vertical swipes
        if (gestureState.dy > 0) {
          dragY.current = gestureState.dy;
          translateY.setValue(gestureState.dy);
        }
      },
      // Allow the gesture to be terminated by other responders (like ScrollView)
      // This ensures ScrollView can take over if user is actually trying to scroll
      onPanResponderTerminationRequest: () => true,
      onPanResponderRelease: (_, gestureState) => {
        logger.debug('[SessionSelectorModal] Pan gesture released:', {
          dx: gestureState.dx,
          dy: gestureState.dy,
          horizontalThreshold: HORIZONTAL_SWIPE_THRESHOLD,
          verticalThreshold: VERTICAL_SWIPE_THRESHOLD,
          canScrollBack,
          canScrollForward,
        });
        
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
        const isVerticalSwipe = Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.5;
        
        if (isVerticalSwipe && gestureState.dy > VERTICAL_SWIPE_THRESHOLD) {
          logger.debug('[SessionSelectorModal] Swiping down to close');
          Animated.timing(translateY, {
            toValue: 500,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            onClose();
          });
        } else if (isHorizontalSwipe) {
          if (gestureState.dx > HORIZONTAL_SWIPE_THRESHOLD && canScrollBack) {
            logger.debug('[SessionSelectorModal] Swiping to previous day');
            onDayChange(dayIndex - 1);
          } else if (gestureState.dx < -HORIZONTAL_SWIPE_THRESHOLD && canScrollForward) {
            logger.debug('[SessionSelectorModal] Swiping to next day');
            onDayChange(dayIndex + 1);
          }
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  logger.debug('[SessionSelectorModal] Rendered with:', {
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

  logger.debug('[SessionSelectorModal] Available sessions:', availableSessions.length);

  const handleSelect = async (session: Session | null) => {
    // Prevent duplicate taps during loading
    if (isLoading) return;

    logger.debug('[SessionSelectorModal] Selecting session:', session?.id);
    setIsLoading(true);
    
    try {
      await onSelect(session);
      // Only close modal after successful save
      onClose();
    } catch (error) {
      logger.error('[SessionSelectorModal] Error selecting session:', error);
      // Keep modal open on error so user can retry
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View 
          style={[
            styles.modalContent,
            {
              transform: [{ translateY }],
            },
          ]} 
          {...panResponder.panHandlers}
        >
          <View style={styles.header}>
            <View style={styles.swipeContainer}>
              <View style={styles.swipeHandle} />
            </View>
            <View style={styles.closeContainer}>
              <Pressable onPress={onClose} style={styles.closeButton} disabled={isLoading}>
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
                  style={[styles.navButton, (!canScrollBack || isLoading) && styles.navButtonDisabled]}
                  onPress={() => canScrollBack && !isLoading && onDayChange(dayIndex - 1)}
                  disabled={!canScrollBack || isLoading}
                >
                  <Text style={[styles.navText, (!canScrollBack || isLoading) && styles.navTextDisabled]}>←</Text>
                </Pressable>
                <Text style={styles.dayIndicator}>
                  {dayIndex + 1}/7
                </Text>
                <Pressable
                  style={[styles.navButton, (!canScrollForward || isLoading) && styles.navButtonDisabled]}
                  onPress={() => canScrollForward && !isLoading && onDayChange(dayIndex + 1)}
                  disabled={!canScrollForward || isLoading}
                >
                  <Text style={[styles.navText, (!canScrollForward || isLoading) && styles.navTextDisabled]}>→</Text>
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
                isLoading && styles.disabledOption,
              ]}
              onPress={() => handleSelect(null)}
              disabled={isLoading}
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
                  disabled={isLoading}
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

          {/* Loading overlay to prevent interaction and show feedback */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={accentColor} />
                <Text style={styles.loadingText}>Saving...</Text>
              </View>
            </View>
          )}
        </Animated.View>
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
    marginTop: SPACING.sm,
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
  loadingOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  loadingContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center' as const,
    gap: SPACING.md,
    minWidth: 150,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
  },
  disabledOption: {
    opacity: 0.5,
  },
});
