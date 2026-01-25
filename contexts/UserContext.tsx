import createContextHook from '@nkzw/create-context-hook';
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { testSupabaseConnection } from '@/lib/connection-test';
import type { Session, User } from '@supabase/supabase-js';
import { errorService } from '@/services/error.service';
import { logger } from '@/lib/logger';

/**
 * UserProfile - Application layer type
 * Uses camelCase naming convention for TypeScript/JavaScript best practices
 * 
 * MAPPING CONVENTION:
 * - Database uses snake_case (accent_color)
 * - Application uses camelCase (accentColor)
 * - Mapping happens in loadUserProfile() and updateProfile()
 */
export type UserProfile = {
  id: string;
  email: string;
  name: string;
  is_pt: boolean;
  accentColor?: string; // App field (camelCase) - Maps to accent_color in database
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  last_login?: string;
};

export type UserStats = {
  currentStreak: number;
  totalVolume: number;
  weekWorkouts: number;
  weekTotal: number;
};

const [UserProviderRaw, useUser] = createContextHook(() => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    currentStreak: 0,
    totalVolume: 0,
    weekWorkouts: 0,
    weekTotal: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Use ref to avoid recreating updateProfile on every user change
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    logger.debug('[UserContext] Initializing auth state...');

    const initializeAuth = async () => {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout')), 10000)
      );

      try {
        const connectionTest = await Promise.race([
          testSupabaseConnection(),
          timeoutPromise
        ]).catch(() => ({ success: false, error: 'Connection timeout' })) as { success: boolean; error?: string };

        if (!connectionTest.success) {
          errorService.capture(new Error(connectionTest.error || 'Connection test failed'), { context: 'UserContext.initializeAuth.connectionTest' });
          setIsLoading(false);
          return;
        }

        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise
        ]).catch(() => ({ data: { session: null }, error: null })) as { data: { session: Session | null }; error: any };
        
        const session = sessionResult.data.session;

        logger.debug('[UserContext] Initial session:', session ? 'Found' : 'None');
        setSession(session);
        if (session?.user) {
          loadUserProfile(session.user);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        errorService.capture(error, { context: 'UserContext.initializeAuth' });
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      logger.debug('[UserContext] Auth state changed:', _event, session ? 'Session exists' : 'No session');
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (authUser: User) => {
    try {
      logger.debug('[UserContext] Loading profile for user:', authUser.id);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('name, role, is_pt, accent_color')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (error) {
        errorService.capture(new Error(error.message), { 
          context: 'UserContext.loadUserProfile',
          code: error.code,
          details: error.details,
          hint: error.hint
        });
      }

      if (!profile) {
        logger.warn('[UserContext] No profile found for user, creating default user object');
      } else {
        logger.debug('[UserContext] Profile loaded successfully:', { 
          name: profile.name, 
          is_pt: profile.is_pt,
          accentColor: profile.accent_color 
        });
      }

      // FIX: Only set isFirstVisit to true if NO profile exists
      // This prevents onboarding screens from appearing on every app open
      setIsFirstVisit(!profile);
      setUser({
        id: authUser.id,
        email: authUser.email || '',
        name: profile?.name || '',
        is_pt: profile?.is_pt || false,
        accentColor: profile?.accent_color || undefined, // Map DB snake_case to app camelCase
      });
      setIsLoading(false);
    } catch (error) {
      errorService.capture(error, { context: 'UserContext.loadUserProfile' });
      // In case of error, assume first visit for safety
      setIsFirstVisit(true);
      setUser({
        id: authUser.id,
        email: authUser.email || '',
        name: '',
        is_pt: false,
      });
      setIsLoading(false);
    }
  };

  const signin = useCallback(async (email: string, password: string) => {
    try {
      logger.debug('[UserContext] Signing in:', email);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (error) {
        errorService.capture(new Error(error.message), { context: 'UserContext.signin' });
        return { success: false, error: error.message };
      }

      logger.debug('[UserContext] Sign in successful');
      return { success: true };
    } catch (error: any) {
      errorService.capture(error, { context: 'UserContext.signin' });
      return { success: false, error: error.message || 'Sign in failed' };
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    try {
      logger.debug('[UserContext] Signing up:', email);
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
      });

      if (error) {
        errorService.capture(new Error(error.message), { context: 'UserContext.signup' });
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Failed to create user' };
      }

      logger.debug('[UserContext] User created, updating profile with name:', name);
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ name })
        .eq('user_id', data.user.id);

      if (profileError) {
        errorService.capture(new Error(profileError.message), { context: 'UserContext.signup.updateProfile' });
      }

      logger.debug('[UserContext] Sign up successful');
      return { success: true };
    } catch (error: any) {
      errorService.capture(error, { context: 'UserContext.signup' });
      return { success: false, error: error.message || 'Sign up failed' };
    }
  }, []);

  // Stable updateProfile - uses ref to avoid recreating on every user change
  const updateProfile = useCallback(async (updates: Partial<Pick<UserProfile, 'name' | 'is_pt' | 'accentColor' | 'gender'>>) => {
    const currentUser = userRef.current;
    if (!currentUser) return { success: false, error: 'Not authenticated' };

    try {
      logger.debug('[UserContext] Updating profile:', updates);
      
      // Map application layer (camelCase) to database layer (snake_case)
      const dbUpdates: Record<string, any> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.is_pt !== undefined) dbUpdates.is_pt = updates.is_pt;
      if (updates.accentColor !== undefined) dbUpdates.accent_color = updates.accentColor; // Map camelCase to snake_case
      if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
      
      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('user_id', currentUser.id);

      if (error) {
        errorService.capture(new Error(error.message), { context: 'UserContext.updateProfile' });
        return { success: false, error: error.message };
      }

      setUser((prev) => prev ? { ...prev, ...updates } : null);
      logger.debug('[UserContext] Profile updated successfully:', updates);
      return { success: true };
    } catch (error: any) {
      errorService.capture(error, { context: 'UserContext.updateProfile' });
      return { success: false, error: error.message || 'Update failed' };
    }
  }, []); // Empty deps - uses userRef.current for stable reference

  const updateStats = useCallback((newStats: Partial<UserStats>) => {
    setStats((prev) => ({ ...prev, ...newStats }));
  }, []);

  const signout = useCallback(async () => {
    try {
      logger.debug('[UserContext] Signing out');
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setStats({
        currentStreak: 0,
        totalVolume: 0,
        weekWorkouts: 0,
        weekTotal: 0,
      });
    } catch (error) {
      errorService.capture(error, { context: 'UserContext.signout' });
    }
  }, []);

  const isAuthenticated = useMemo(() => !!session && !!user, [session, user]);
  const accessToken = useMemo(() => session?.access_token || null, [session]);

  return useMemo(() => ({
    user,
    session,
    stats,
    isLoading,
    isAuthenticated,
    accessToken,
    isFirstVisit,
    signin,
    signup,
    signout,
    updateProfile,
    updateStats,
  }), [user, session, stats, isLoading, isAuthenticated, accessToken, isFirstVisit, signin, signup, signout, updateProfile, updateStats]);
});

// Wrap provider with React.memo to prevent unnecessary re-renders
// Provider only re-renders when children prop changes
export const UserProvider = React.memo(UserProviderRaw);

export { useUser };
