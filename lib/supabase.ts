import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

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

function getSupabaseClient(): SupabaseClient {
  if (_supabaseClient) {
    return _supabaseClient;
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

  console.log('[Supabase] Creating client with:', {
    url: supabaseUrl || 'MISSING',
    keyPresent: !!supabaseAnonKey,
    platform: Platform.OS,
  });

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase] ⚠️  Missing environment variables!');
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
