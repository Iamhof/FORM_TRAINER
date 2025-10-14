import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { trpcClient } from '@/lib/trpc';

const AUTH_TOKEN_KEY = 'auth_token';

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  selectedColor?: string;
};

export type UserStats = {
  currentStreak: number;
  totalVolume: number;
  weekWorkouts: number;
  weekTotal: number;
};

export const [UserProvider, useUser] = createContextHook(() => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({
    currentStreak: 0,
    totalVolume: 0,
    weekWorkouts: 0,
    weekTotal: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        setAuthToken(token);
        const userData = await trpcClient.auth.me.query();
        setUser({
          id: userData.id,
          email: userData.email,
          name: userData.name,
        });
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      setAuthToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signin = useCallback(async (email: string, password: string) => {
    try {
      const response = await trpcClient.auth.signin.mutate({ email, password });
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.token);
      setAuthToken(response.token);
      setUser({
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
      });
      return { success: true };
    } catch (error: any) {
      console.error('Sign in failed:', error);
      return { success: false, error: error.message || 'Sign in failed' };
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    try {
      const response = await trpcClient.auth.signup.mutate({ email, password, name });
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.token);
      setAuthToken(response.token);
      setUser({
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
      });
      return { success: true };
    } catch (error: any) {
      console.error('Sign up failed:', error);
      return { success: false, error: error.message || 'Sign up failed' };
    }
  }, []);

  const updateStats = useCallback((newStats: Partial<UserStats>) => {
    setStats((prev) => ({ ...prev, ...newStats }));
  }, []);

  const signout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      setAuthToken(null);
      setUser(null);
      setStats({
        currentStreak: 0,
        totalVolume: 0,
        weekWorkouts: 0,
        weekTotal: 0,
      });
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  }, []);

  const isAuthenticated = useMemo(() => !!authToken && !!user, [authToken, user]);

  return useMemo(() => ({
    user,
    stats,
    isLoading,
    isAuthenticated,
    authToken,
    signin,
    signup,
    signout,
    updateStats,
  }), [user, stats, isLoading, isAuthenticated, authToken, signin, signup, signout, updateStats]);
});
