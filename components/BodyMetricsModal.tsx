import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { X, Scale, Dumbbell, Droplet, Calendar } from 'lucide-react-native';
import { COLORS, SPACING } from '@/constants/theme';
import { useBodyMetrics } from '@/contexts/BodyMetricsContext';
import Button from './Button';

interface BodyMetricsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function BodyMetricsModal({ visible, onClose }: BodyMetricsModalProps) {
  const { logBodyMetrics, isLoggingMetrics, latestMetrics } = useBodyMetrics();
  const [date, setDate] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [muscleMass, setMuscleMass] = useState<string>('');
  const [bodyFat, setBodyFat] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (visible) {
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      setWeight(latestMetrics?.weight?.toString() || '');
      setMuscleMass(latestMetrics?.muscle_mass?.toString() || '');
      setBodyFat(latestMetrics?.body_fat_percentage?.toString() || '');
      setNotes('');
      setError('');
    }
  }, [visible, latestMetrics]);

  const handleSubmit = async () => {
    setError('');

    if (!date) {
      setError('Please select a date');
      return;
    }

    if (!weight && !muscleMass && !bodyFat) {
      setError('Please enter at least one metric');
      return;
    }

    const weightNum = weight ? parseFloat(weight) : undefined;
    const muscleMassNum = muscleMass ? parseFloat(muscleMass) : undefined;
    const bodyFatNum = bodyFat ? parseFloat(bodyFat) : undefined;

    if (weightNum !== undefined && (isNaN(weightNum) || weightNum <= 0)) {
      setError('Weight must be a positive number');
      return;
    }

    if (muscleMassNum !== undefined && (isNaN(muscleMassNum) || muscleMassNum <= 0)) {
      setError('Muscle mass must be a positive number');
      return;
    }

    if (bodyFatNum !== undefined && (isNaN(bodyFatNum) || bodyFatNum < 0 || bodyFatNum > 100)) {
      setError('Body fat percentage must be between 0 and 100');
      return;
    }

    try {
      await logBodyMetrics({
        date,
        weight: weightNum,
        muscleMass: muscleMassNum,
        bodyFatPercentage: bodyFatNum,
        notes: notes || undefined,
      });
      onClose();
    } catch (err) {
      setError('Failed to log body metrics. Please try again.');
      console.error('[BodyMetricsModal] Error logging metrics:', err);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Log Body Metrics</Text>
              <Text style={styles.subtitle}>Track your body composition progress</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={24} color={COLORS.textSecondary} strokeWidth={2} />
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.field}>
              <View style={styles.fieldLabel}>
                <Calendar size={18} color={COLORS.textSecondary} strokeWidth={2} />
                <Text style={styles.fieldLabelText}>Date</Text>
              </View>
              <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
              />
            </View>

            <View style={styles.field}>
              <View style={styles.fieldLabel}>
                <Scale size={18} color={COLORS.textSecondary} strokeWidth={2} />
                <Text style={styles.fieldLabelText}>Weight (kg)</Text>
              </View>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                placeholder="70.5"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.field}>
              <View style={styles.fieldLabel}>
                <Dumbbell size={18} color={COLORS.textSecondary} strokeWidth={2} />
                <Text style={styles.fieldLabelText}>Muscle Mass (kg)</Text>
              </View>
              <TextInput
                style={styles.input}
                value={muscleMass}
                onChangeText={setMuscleMass}
                placeholder="50.5"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.field}>
              <View style={styles.fieldLabel}>
                <Droplet size={18} color={COLORS.textSecondary} strokeWidth={2} />
                <Text style={styles.fieldLabelText}>Body Fat %</Text>
              </View>
              <TextInput
                style={styles.input}
                value={bodyFat}
                onChangeText={setBodyFat}
                placeholder="15.5"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.fieldLabelText, { marginBottom: SPACING.xs }]}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any notes about your measurement..."
                placeholderTextColor={COLORS.textSecondary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.footer}>
            <Button variant="outline" onPress={onClose} style={{ flex: 1 }} title="Cancel" />
            <Button
              onPress={handleSubmit}
              style={{ flex: 1 }}
              disabled={isLoggingMetrics}
              title={isLoggingMetrics ? 'Saving...' : 'Save Metrics'}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: SPACING.lg,
  },
  field: {
    marginBottom: SPACING.lg,
  },
  fieldLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  fieldLabelText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  textArea: {
    height: 80,
    paddingTop: SPACING.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: 'center' as const,
    marginTop: SPACING.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
});
