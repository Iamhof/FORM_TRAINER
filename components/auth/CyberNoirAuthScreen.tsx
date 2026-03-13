import { AtSign, Lock } from 'lucide-react-native';
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, SPACING, NEON } from '@/constants/theme';

import AuthFormCard from './AuthFormCard';
import AuthHeader from './AuthHeader';
import GhostGlowButton from './GhostGlowButton';
import GradientButton from './GradientButton';
import NeonInput from './NeonInput';

type CyberNoirAuthScreenProps = {
  isSignUp: boolean;
  email: string;
  password: string;
  confirmPassword: string;
  loading: boolean;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  handleAuth: () => void;
  handleForgotPassword: () => void;
  toggleMode: () => void;
};

export default function CyberNoirAuthScreen({
  isSignUp,
  email,
  password,
  confirmPassword,
  loading,
  setEmail,
  setPassword,
  setConfirmPassword,
  handleAuth,
  handleForgotPassword,
  toggleMode,
}: CyberNoirAuthScreenProps) {
  const confirmOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(confirmOpacity, {
      toValue: isSignUp ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isSignUp, confirmOpacity]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AuthHeader />

          <AuthFormCard>
            <View style={styles.formFields}>
              <NeonInput
                label="EMAIL ADDRESS"
                icon={<AtSign size={14} color={NEON.primary} strokeWidth={2.5} />}
                placeholder="ENTER YOUR EMAIL"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />

              <NeonInput
                label="PASSWORD"
                icon={<Lock size={14} color={NEON.primary} strokeWidth={2.5} />}
                placeholder="ENTER YOUR PASSWORD"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />

              {!isSignUp && (
                <Pressable onPress={handleForgotPassword} style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                </Pressable>
              )}

              {isSignUp && (
                <Animated.View style={{ opacity: confirmOpacity }}>
                  <NeonInput
                    label="CONFIRM PASSWORD"
                    icon={<Lock size={14} color={NEON.primary} strokeWidth={2.5} />}
                    placeholder="CONFIRM YOUR PASSWORD"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </Animated.View>
              )}

              <View style={styles.buttonGroup}>
                {isSignUp ? (
                  <>
                    <GradientButton
                      title="JOIN THE COLLECTIVE"
                      onPress={handleAuth}
                      loading={loading}
                      disabled={loading}
                    />
                    <Text style={styles.orText}>or</Text>
                    <GhostGlowButton
                      title="SIGN IN"
                      onPress={toggleMode}
                    />
                  </>
                ) : (
                  <>
                    <GradientButton
                      title="SIGN IN"
                      onPress={handleAuth}
                      loading={loading}
                      disabled={loading}
                    />
                    <Text style={styles.orText}>or</Text>
                    <GhostGlowButton
                      title="JOIN THE COLLECTIVE"
                      onPress={toggleMode}
                    />
                  </>
                )}
              </View>
            </View>
          </AuthFormCard>

          <Text style={styles.footerText}>POWERED BY OJ GYMS</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl * 2,
    paddingBottom: SPACING.xl,
  },
  formFields: {
    gap: SPACING.lg,
  },
  buttonGroup: {
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -SPACING.sm,
  },
  forgotPasswordText: {
    fontSize: 12,
    color: NEON.primary,
    letterSpacing: 0.5,
  },
  orText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    letterSpacing: 1,
  },
  footerText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textTertiary,
    textAlign: 'center',
    letterSpacing: 1,
    marginTop: SPACING.xl,
  },
});
