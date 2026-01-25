import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type ComingSoonScreenProps = {
  feature: string;
  description: string;
  icon: React.ReactNode;
  eta?: string;
};

export default function ComingSoonScreen({ 
  feature, 
  description, 
  icon,
  eta = 'Next Update'
}: ComingSoonScreenProps) {
  const { accent } = useTheme();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        <Text style={styles.title}>{feature} Coming Soon!</Text>
        <Text style={styles.description}>{description}</Text>
        <View style={[styles.etaBadge, { borderColor: accent }]}>
          <Text style={[styles.etaText, { color: accent }]}>Expected: {eta}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  iconContainer: {
    marginBottom: SPACING.xl,
    opacity: 0.6,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  etaBadge: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 2,
  },
  etaText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
