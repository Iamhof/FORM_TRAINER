import { useLocalSearchParams, useRouter } from 'expo-router';
import { Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, SPACING } from '@/constants/theme';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    if (!email || isResending) return;
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) {
        logger.error('[VerifyEmail] Resend failed:', error.message);
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Email Sent', 'A new verification email has been sent.');
      }
    } catch (error) {
      logger.error('[VerifyEmail] Unexpected resend error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Mail size={48} color={COLORS.textPrimary} strokeWidth={1.5} />
        </View>
        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.body}>
          We sent a verification link to{'\n'}
          <Text style={styles.email}>{email}</Text>
        </Text>
        <Text style={styles.hint}>
          Click the link in the email to verify your account, then come back to sign in.
        </Text>

        <Pressable style={styles.resendButton} onPress={handleResend} disabled={isResending}>
          <Text style={styles.resendText}>
            {isResending ? 'Sending...' : 'Resend Verification Email'}
          </Text>
        </Pressable>

        <Pressable style={styles.backButton} onPress={() => router.replace('/auth')}>
          <Text style={styles.backText}>Back to Login</Text>
        </Pressable>
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.sm,
  },
  email: {
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  hint: {
    fontSize: 14,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  resendButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
    backgroundColor: COLORS.cardBackground,
    marginBottom: SPACING.md,
  },
  resendText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  backButton: {
    paddingVertical: SPACING.sm,
  },
  backText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
  },
});
