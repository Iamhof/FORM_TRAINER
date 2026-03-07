import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';

import { SPACING, NEON, colorWithOpacity } from '@/constants/theme';

type AuthFormCardProps = {
  children: ReactNode;
};

export default function AuthFormCard({ children }: AuthFormCardProps) {
  return (
    <View style={styles.card}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: NEON.cardSurface,
    borderRadius: 20,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: colorWithOpacity('#ffffff', 0.06),
  },
});
