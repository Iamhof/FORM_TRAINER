import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { Dumbbell } from 'lucide-react-native';

export default function AuthScreen() {
  const router = useRouter();
  const { accent } = useTheme();
  const { signin, signup } = useUser();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const confirmPasswordHeight = useRef(new Animated.Value(0)).current;
  const nameHeight = useRef(new Animated.Value(0)).current;

  const toggleMode = () => {
    const newIsSignUp = !isSignUp;
    setIsSignUp(newIsSignUp);

    if (newIsSignUp) {
      Animated.parallel([
        Animated.timing(nameHeight, {
          toValue: 72,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(confirmPasswordHeight, {
          toValue: 72,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      setName('');
      setConfirmPassword('');
      Animated.parallel([
        Animated.timing(nameHeight, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(confirmPasswordHeight, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (isSignUp) {
      if (!name) {
        Alert.alert('Error', 'Please enter your name');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return;
      }
    }

    setIsLoading(true);
    
    try {
      if (isSignUp) {
        const result = await signup(email, password, name);
        if (result.success) {
          router.replace('/(tabs)/home');
        } else {
          Alert.alert('Sign Up Failed', result.error || 'Please try again');
        }
      } else {
        const result = await signin(email, password);
        if (result.success) {
          router.replace('/(tabs)/home');
        } else {
          Alert.alert('Sign In Failed', result.error || 'Invalid email or password');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <View style={[styles.logoBox, { borderColor: accent }]}>
            <Dumbbell size={40} color={accent} strokeWidth={2} />
          </View>
        </View>

        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: COLORS.textPrimary }]}>
            WELCOME TO FORM
          </Text>
          <Text style={[styles.subtitle, { color: accent }]}>
            {isSignUp ? 'Create your account to start training' : 'Sign in to start your training journey'}
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Animated.View
            style={[
              styles.confirmPasswordContainer,
              {
                height: nameHeight,
              },
            ]}
          >
            <TextInput
              style={[styles.input, { borderColor: accent, color: COLORS.textPrimary }]}
              placeholder="Full Name"
              placeholderTextColor={COLORS.textSecondary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={isSignUp}
            />
          </Animated.View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { borderColor: accent, color: COLORS.textPrimary }]}
              placeholder="Email"
              placeholderTextColor={COLORS.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { borderColor: accent, color: COLORS.textPrimary }]}
              placeholder="Password"
              placeholderTextColor={COLORS.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
            />
          </View>

          <Animated.View
            style={[
              styles.confirmPasswordContainer,
              {
                height: confirmPasswordHeight,
              },
            ]}
          >
            <TextInput
              style={[styles.input, { borderColor: accent, color: COLORS.textPrimary }]}
              placeholder="Confirm Password"
              placeholderTextColor={COLORS.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={isSignUp}
            />
          </Animated.View>

          <TouchableOpacity
            style={[styles.authButton, { backgroundColor: accent }]}
            onPress={handleAuth}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.background} />
            ) : (
              <Text style={[styles.authButtonText, { color: COLORS.background }]}>
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.toggleContainer} onPress={toggleMode}>
            <Text style={[styles.toggleText, { color: COLORS.textSecondary }]}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <Text style={{ color: accent, fontWeight: '600' as const }}>
                {isSignUp ? 'Sign in' : 'Sign up'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.poweredBy}>
          Powered by <Text style={{ color: accent }}>OJ Gyms</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'flex-start',
    marginBottom: 48,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: '800' as const,
    marginBottom: 12,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    height: 56,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 20,
    fontSize: 16,
    fontWeight: '400' as const,
  },
  confirmPasswordContainer: {
    overflow: 'hidden',
  },
  authButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  authButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  toggleContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '400' as const,
  },
  poweredBy: {
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 'auto',
    paddingTop: 24,
  },
});
