import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { testSupabaseConnection } from '@/lib/connection-test';
import type { Session, User } from '@supabase/supabase-js';

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  is_pt: boolean;
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
  const [session, setSession] = useState<Session | null>(null);
  const [stats, setStats] = useState<UserStats>({
    currentStreak: 0,
    totalVolume: 0,
    weekWorkouts: 0,
    weekTotal: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('[UserContext] Initializing auth state...');
    
    const initializeAuth = async () => {
      const connectionTest = await testSupabaseConnection();
      
      if (!connectionTest.success) {
        console.error('[UserContext] Connection test failed:', connectionTest.error);
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[UserContext] Initial session:', session ? 'Found' : 'None');
        setSession(session);
        if (session?.user) {
          loadUserProfile(session.user);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('[UserContext] Failed to get initial session:', error);
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[UserContext] Auth state changed:', _event, session ? 'Session exists' : 'No session');
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
      console.log('[UserContext] Loading profile for user:', authUser.id);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('name, role, is_pt')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (error) {
        console.error('[UserContext] Error loading profile:');
        console.error('[UserContext] Error code:', error.code);
        console.error('[UserContext] Error message:', error.message);
        console.error('[UserContext] Error details:', error.details);
        console.error('[UserContext] Error hint:', error.hint);
      }

      if (!profile) {
        console.warn('[UserContext] No profile found for user, creating default user object');
      } else {
        console.log('[UserContext] Profile loaded successfully:', { name: profile.name, is_pt: profile.is_pt });
      }

      setUser({
        id: authUser.id,
        email: authUser.email || '',
        name: profile?.name || '',
        is_pt: profile?.is_pt || false,
      });
    } catch (error) {
      console.error('[UserContext] Exception while loading profile:', error instanceof Error ? error.message : String(error));
      setUser({
        id: authUser.id,
        email: authUser.email || '',
        name: '',
        is_pt: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signin = useCallback(async (email: string, password: string) => {
    try {
      console.log('[UserContext] Signing in:', email);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (error) {
        console.error('[UserContext] Sign in error:', error.message);
        return { success: false, error: error.message };
      }

      console.log('[UserContext] Sign in successful');
      return { success: true };
    } catch (error: any) {
      console.error('[UserContext] Sign in failed:', error);
      return { success: false, error: error.message || 'Sign in failed' };
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    try {
      console.log('[UserContext] Signing up:', email);
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
      });

      if (error) {
        console.error('[UserContext] Sign up error:', error.message);
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Failed to create user' };
      }

      console.log('[UserContext] User created, updating profile with name:', name);
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ name })
        .eq('user_id', data.user.id);

      if (profileError) {
        console.error('[UserContext] Profile update error:', profileError);
      }

      console.log('[UserContext] Sign up successful');
      return { success: true };
    } catch (error: any) {
      console.error('[UserContext] Sign up failed:', error);
      return { success: false, error: error.message || 'Sign up failed' };
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Pick<UserProfile, 'name' | 'is_pt'>>) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      console.log('[UserContext] Updating profile:', updates);
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) {
        console.error('[UserContext] Profile update error:', error);
        return { success: false, error: error.message };
      }

      setUser((prev) => prev ? { ...prev, ...updates } : null);
      return { success: true };
    } catch (error: any) {
      console.error('[UserContext] Profile update failed:', error);
      return { success: false, error: error.message || 'Update failed' };
    }
  }, [user]);

  const updateStats = useCallback((newStats: Partial<UserStats>) => {
    setStats((prev) => ({ ...prev, ...newStats }));
  }, []);

  const signout = useCallback(async () => {
    try {
      console.log('[UserContext] Signing out');
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
      console.error('[UserContext] Failed to sign out:', error);
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
    signin,
    signup,
    signout,
    updateProfile,
    updateStats,
  }), [user, session, stats, isLoading, isAuthenticated, accessToken, signin, signup, signout, updateProfile, updateStats]);
});
