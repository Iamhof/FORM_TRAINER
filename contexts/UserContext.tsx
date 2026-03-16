import createContextHook from '@nkzw/create-context-hook';
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';

import { narrowError } from '@/lib/error-utils';
import { logger } from '@/lib/logger';
import { getElapsedTime } from '@/lib/runtime-utils';
import { supabase } from '@/lib/supabase';
import { errorService } from '@/services/error.service';

import type { Session, User } from '@supabase/supabase-js';

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
  heightCm?: number | null;
  weightKg?: number | null;
  age?: number | null;
  currentXp: number;      // Maps from current_xp in database
  currentLevel: number;   // Maps from current_level in database
  last_login?: string;
};

/**
 * Database profile updates type
 * Uses snake_case for database column names
 */
type ProfileDatabaseUpdates = {
  name?: string;
  is_pt?: boolean;
  accent_color?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  height_cm?: number | null;
  weight_kg?: number | null;
  age?: number | null;
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

  // Guard against concurrent loadUserProfile calls from rapid auth events
  const isLoadingProfileRef = useRef(false);

  useEffect(() => {
    logger.debug('[UserContext] Initializing auth state...');

    // Safety timeout: if INITIAL_SESSION never fires (e.g., SecureStore hang),
    // assume no session after 5s so the app doesn't get stuck on splash
    const safetyTimer = setTimeout(() => {
      setIsLoading((prev) => {
        if (prev) {
          logger.warn('[UserContext] Auth safety timeout - assuming no session');
        }
        return false;
      });
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const elapsed = getElapsedTime();
        logger.info(`[Perf] Auth event: ${event} { elapsed: ${elapsed}ms }`);
        logger.debug('[UserContext] Auth event:', event, session ? 'has session' : 'no session');
        clearTimeout(safetyTimer);
        setSession(session);

        if (session?.user) {
          if (!isLoadingProfileRef.current) {
            isLoadingProfileRef.current = true;
            await loadUserProfile(session.user);
            isLoadingProfileRef.current = false;
          }
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (authUser: User) => {
    try {
      logger.debug('[UserContext] Loading profile for user:', authUser.id);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('name, role, is_pt, accent_color, gender, height_cm, weight_kg, age, current_xp, current_level')
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

      const elapsed = global.__APP_START_TIME ? Date.now() - global.__APP_START_TIME : 0;
      logger.info(`[Perf] Profile loaded { elapsed: ${elapsed}ms }`);

      // FIX: Only set isFirstVisit to true if NO profile exists
      // This prevents onboarding screens from appearing on every app open
      setIsFirstVisit(!profile);
      setUser({
        id: authUser.id,
        email: authUser.email || '',
        name: profile?.name || '',
        is_pt: profile?.is_pt || false,
        accentColor: profile?.accent_color || undefined, // Map DB snake_case to app camelCase
        gender: profile?.gender || undefined,
        heightCm: profile?.height_cm ?? null,
        weightKg: profile?.weight_kg ?? null,
        age: profile?.age ?? null,
        currentXp: profile?.current_xp ?? 0,
        currentLevel: profile?.current_level ?? 1,
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
        currentXp: 0,
        currentLevel: 1,
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
    } catch (error: unknown) {
      const typedError = narrowError(error);
      errorService.capture(error, { context: 'UserContext.signin' });
      return { success: false, error: typedError.message || 'Sign in failed' };
    }
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
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

      // Note: profile name is set later in /profile-setup via updateProfile(),
      // after the handle_new_user() trigger has created the profile row.
      logger.debug('[UserContext] Sign up successful');
      return { success: true };
    } catch (error: unknown) {
      const typedError = narrowError(error);
      errorService.capture(error, { context: 'UserContext.signup' });
      return { success: false, error: typedError.message || 'Sign up failed' };
    }
  }, []);

  // Stable updateProfile - uses ref to avoid recreating on every user change
  const updateProfile = useCallback(async (updates: Partial<Pick<UserProfile, 'name' | 'is_pt' | 'accentColor' | 'gender' | 'heightCm' | 'weightKg' | 'age'>>) => {
    const currentUser = userRef.current;
    if (!currentUser) return { success: false, error: 'Not authenticated' };

    try {
      logger.debug('[UserContext] Updating profile:', updates);

      // Map application layer (camelCase) to database layer (snake_case)
      const dbUpdates: ProfileDatabaseUpdates = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.is_pt !== undefined) dbUpdates.is_pt = updates.is_pt;
      if (updates.accentColor !== undefined) dbUpdates.accent_color = updates.accentColor; // Map camelCase to snake_case
      if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
      if (updates.heightCm !== undefined) dbUpdates.height_cm = updates.heightCm;
      if (updates.weightKg !== undefined) dbUpdates.weight_kg = updates.weightKg;
      if (updates.age !== undefined) dbUpdates.age = updates.age;

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
    } catch (error: unknown) {
      const typedError = narrowError(error);
      errorService.capture(error, { context: 'UserContext.updateProfile' });
      return { success: false, error: typedError.message || 'Update failed' };
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
