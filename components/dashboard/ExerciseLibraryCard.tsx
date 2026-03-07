import { BookOpen, ChevronRight } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';

import Card from '@/components/Card';
import { COLORS, SPACING } from '@/constants/theme';

type ExerciseLibraryCardProps = {
  accent: string;
  onPress: () => void;
};

export default function ExerciseLibraryCard({
  accent,
  onPress,
}: ExerciseLibraryCardProps) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.iconSquare, { backgroundColor: `${accent}15` }]}>
            <BookOpen size={22} color={accent} strokeWidth={2} />
          </View>
          <View style={styles.textArea}>
            <Text style={styles.title}>EXERCISE HUB</Text>
            <Text style={styles.subtitle}>Instructional video library</Text>
          </View>
          <ChevronRight size={18} color={COLORS.textSecondary} strokeWidth={2.5} />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconSquare: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textArea: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    color: COLORS.textPrimary,
    letterSpacing: 2,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
