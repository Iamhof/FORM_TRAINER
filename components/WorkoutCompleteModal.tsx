import React, { useRef, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import { COLORS, SPACING } from '@/constants/theme';
import { logger } from '@/lib/logger';

export interface WorkoutSummary {
  title: string;
  date: string;
  totalTime: string;
  totalVolume: number;
  exercises: number;
  calories: number;
  sets: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  summary: WorkoutSummary;
  accentColor?: string;
}

const WorkoutCompleteModal: React.FC<Props> = ({ 
  visible, 
  onClose, 
  summary, 
  accentColor = COLORS.accents.orange 
}) => {
  const cannonRef = useRef<ConfettiCannon>(null);
  const cardShotRef = useRef<ViewShot>(null);
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      setTimeout(() => {
        cannonRef.current?.start();
      }, 100);

      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(opacityAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const getTintedColors = (baseColor: string) => {
    return [baseColor, '#FFFFFF', '#FFD700', baseColor];
  };

  const handleShare = async () => {
    try {
      if (Platform.OS === 'web') {
        logger.debug('[WorkoutCompleteModal] Sharing not supported on web');
        return;
      }

      const uri = await cardShotRef.current?.capture?.();
      if (uri) {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Share your workout!',
          });
        }
      }
    } catch (error) {
      logger.error('[WorkoutCompleteModal] Sharing failed:', error);
    }
  };

  if (!visible) return null;

  return (
    <Modal animationType="none" transparent={true} visible={visible}>
      <BlurView intensity={30} tint="dark" style={styles.blurContainer}>
        <Animated.View style={[styles.flexContainer, { opacity: opacityAnim }]}>
          <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <View style={styles.contentContainer}>
              <ViewShot 
                ref={cardShotRef} 
                options={{ fileName: "workout-summary", format: "png", quality: 0.9 }}
                style={styles.screenshotContainer}
              >
                <View style={styles.shareableContent}>
                  <Text style={styles.title}>{summary.title}</Text>
                  <Text style={styles.date}>{summary.date}</Text>

                  <View style={styles.card}>
                    <View style={styles.statRow}>
                      <StatItem label="Total Time" value={summary.totalTime} />
                      <StatItem label="Exercises" value={String(summary.exercises)} />
                    </View>
                    <View style={styles.statRow}>
                      <StatItem label="Total Volume" value={`${summary.totalVolume.toLocaleString()} kg`} />
                      <StatItem label="Sets" value={String(summary.sets)} />
                    </View>
                    <View style={styles.statRow}>
                      <StatItem label="Calories" value={`${summary.calories} kcal`} />
                      <View style={styles.statItem} />
                    </View>
                  </View>
                </View>
              </ViewShot>
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.detailsButton, { backgroundColor: accentColor }]} 
                onPress={handleShare}
              >
                <Text style={styles.detailsButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>

        {visible && Platform.OS !== 'web' && (
          <ConfettiCannon
            ref={cannonRef}
            count={250}
            origin={{ x: -10, y: 0 }}
            autoStart={false}
            fadeOut={true}
            explosionSpeed={500}
            fallSpeed={3500}
            colors={getTintedColors(accentColor)}
          />
        )}
      </BlurView>
    </Modal>
  );
};

const StatItem = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.statItem}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
  },
  flexContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  closeButton: {
    position: 'absolute' as const,
    top: SPACING.xl,
    left: SPACING.lg,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: COLORS.textPrimary,
    fontSize: 32,
    fontWeight: '200' as const,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  screenshotContainer: {
    backgroundColor: 'transparent',
  },
  shareableContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 40,
    fontWeight: '800' as const,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  date: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  card: {
    backgroundColor: 'rgba(28, 28, 30, 0.95)',
    borderRadius: 24,
    width: '100%',
    padding: SPACING.xl,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: SPACING.xs,
    fontWeight: '500' as const,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '700' as const,
  },
  buttonContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  detailsButton: {
    paddingVertical: SPACING.lg,
    borderRadius: 18,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700' as const,
  },
});

export default WorkoutCompleteModal;
