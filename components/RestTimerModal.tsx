import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, Pressable } from 'react-native';
import { Clock } from 'lucide-react-native';
import { COLORS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type RestTimerModalProps = {
  visible: boolean;
  duration: number;
  onSkip: () => void;
  onComplete: () => void;
};

export default function RestTimerModal({
  visible,
  duration,
  onSkip,
  onComplete,
}: RestTimerModalProps) {
  const { accent } = useTheme();
  const [timeRemaining, setTimeRemaining] = useState(duration);

  useEffect(() => {
    if (visible) {
      setTimeRemaining(duration);
    }
  }, [visible, duration]);

  useEffect(() => {
    if (!visible || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(onComplete, 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, timeRemaining, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onSkip}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { borderColor: accent }]}>
          <View style={[styles.iconContainer, { backgroundColor: `${accent}20` }]}>
            <Clock size={48} color={accent} strokeWidth={2} />
          </View>
          
          <Text style={styles.time}>{formatTime(timeRemaining)}</Text>
          <Text style={styles.subtitle}>Rest time remaining</Text>

          <Pressable
            style={[styles.skipButton, { borderColor: COLORS.textPrimary }]}
            onPress={onSkip}
          >
            <Text style={styles.skipButtonText}>Skip Rest</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  container: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 24,
    borderWidth: 2,
    padding: SPACING.xxl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  time: {
    fontSize: 64,
    fontWeight: '800' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  skipButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
  },
});
