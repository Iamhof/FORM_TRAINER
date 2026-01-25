import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { COLORS, SPACING } from '@/constants/theme';

type CardProps = {
  children: ReactNode;
  style?: ViewStyle;
  testID?: string;
};

export default function Card({ children, style, testID }: CardProps) {
  return (
    <View style={[styles.card, style]} testID={testID}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.md,
  },
});
