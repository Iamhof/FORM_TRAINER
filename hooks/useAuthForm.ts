import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, LayoutAnimation, Platform, UIManager } from 'react-native';

import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function useAuthForm() {
  const router = useRouter();
  const { signin, signup } = useUser();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (isSignUp) {
      if (!confirmPassword) {
        Alert.alert('Error', 'Please confirm your password');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
    }

    setLoading(true);
    try {
      const result = isSignUp
        ? await signup(email, password)
        : await signin(email, password);

      if (result.success) {
        if (isSignUp) {
          router.replace('/profile-setup' as any);
        } else {
          router.replace('/(tabs)/home' as any);
        }
      } else {
        Alert.alert('Error', result.error || 'Authentication failed');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Email Required', 'Please enter your email address to reset your password.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'formworkout://reset-password',
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert(
          'Check Your Email',
          'If an account exists with this email, you will receive a password reset link.',
        );
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        300,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.scaleY,
      ),
    );
    setIsSignUp(!isSignUp);
  };

  return {
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
  };
}
