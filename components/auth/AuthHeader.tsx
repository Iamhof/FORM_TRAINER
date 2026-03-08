import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { COLORS, SPACING } from '@/constants/theme';

import ChromaticText from './ChromaticText';

export default function AuthHeader() {
  return (
    <View style={styles.container}>
      <ChromaticText
        text="FORM"
        intensity={1}
      />

      <Text style={styles.subtitle}>
        One great session at a time
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    letterSpacing: 0.5,
  },
});
