import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@/constants/theme';

type ScreenStateProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onActionPress?: () => void;
  accentColor?: string;
  testID?: string;
};

export function ScreenState({
  icon,
  title,
  description,
  actionLabel,
  onActionPress,
  accentColor = COLORS.accents.blue,
  testID,
}: ScreenStateProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View
        style={[styles.iconContainer, { backgroundColor: `${accentColor}20` }]}
        accessible
        accessibilityRole="image"
      >
        {icon}
      </View>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onActionPress ? (
        <Pressable
          style={[styles.button, { backgroundColor: accentColor }]}
          onPress={onActionPress}
          accessibilityRole="button"
          accessibilityHint={actionLabel}
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.cardBorder}55`,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    backgroundColor: COLORS.accents.blue,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ScreenState;

