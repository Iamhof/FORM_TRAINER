import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const SecureStoreAdapter = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    }
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

let _supabaseClient: SupabaseClient | null = null;

function getEnvVar(key: string): string {
  if (key === 'EXPO_PUBLIC_SUPABASE_URL') {
    return process.env.EXPO_PUBLIC_SUPABASE_URL || 
           Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || 
           'https://yshbcfifmkflhahjengk.supabase.co';
  }
  if (key === 'EXPO_PUBLIC_SUPABASE_ANON_KEY') {
    return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
           Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
           'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzaGJjZmlmbWtmbGhhaGplbmdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjI3NjcsImV4cCI6MjA3NTIzODc2N30.ide524ouRN9wDvl3gdcqL0QVEShOJpM720FNisSj-CQ';
  }
  return '';
}

function getSupabaseClient(): SupabaseClient {
  if (_supabaseClient) {
    return _supabaseClient;
  }

  const supabaseUrl = getEnvVar('EXPO_PUBLIC_SUPABASE_URL');
  const supabaseAnonKey = getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY');

  console.log('[Supabase] Environment check:', {
    processEnvKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE')),
    constantsExtra: Constants.expoConfig?.extra ? Object.keys(Constants.expoConfig.extra) : 'none',
    url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
    keyPresent: !!supabaseAnonKey,
    platform: Platform.OS,
  });

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase] ⚠️  Missing environment variables!');
    console.error('[Supabase] Checked locations:');
    console.error('[Supabase]   1. process.env.EXPO_PUBLIC_SUPABASE_URL');
    console.error('[Supabase]   2. Constants.expoConfig.extra.EXPO_PUBLIC_SUPABASE_URL');
    console.error('[Supabase] Please ensure your .env file contains:');
    console.error('[Supabase]   EXPO_PUBLIC_SUPABASE_URL=your-url');
    console.error('[Supabase]   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key');
    console.error('[Supabase] Then restart with: npx expo start -c');
    
    throw new Error('Missing Supabase environment variables. Please add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file');
  }

  _supabaseClient = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        storage: SecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    }
  );

  return _supabaseClient;
}

export const supabase = getSupabaseClient();
