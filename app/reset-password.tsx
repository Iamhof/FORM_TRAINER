import { Stack, useRouter } from 'expo-router';
import { Lock } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import GradientButton from '@/components/auth/GradientButton';
import NeonInput from '@/components/auth/NeonInput';
import { COLORS, NEON, SPACING } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in both fields.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Your password has been updated.', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/home' as never) },
        ]);
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.background}>
      <Stack.Screen
        options={{
          title: 'Reset Password',
          headerShown: true,
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.textPrimary,
          headerShadowVisible: false,
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.content}>
          <Text style={styles.title}>Set New Password</Text>
          <Text style={styles.subtitle}>Enter your new password below.</Text>

          <View style={styles.form}>
            <NeonInput
              label="NEW PASSWORD"
              icon={<Lock size={14} color={NEON.primary} strokeWidth={2.5} />}
              placeholder="ENTER NEW PASSWORD"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <NeonInput
              label="CONFIRM PASSWORD"
              icon={<Lock size={14} color={NEON.primary} strokeWidth={2.5} />}
              placeholder="CONFIRM NEW PASSWORD"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <GradientButton
              title="UPDATE PASSWORD"
              onPress={handleResetPassword}
              loading={loading}
              disabled={loading}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  form: {
    gap: SPACING.lg,
  },
});
