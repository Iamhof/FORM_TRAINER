import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { env } from './env';
import { logger } from './logger';

// In-process mutual exclusion lock for Supabase auth operations.
// This replaces navigatorLock (which throws unhandled AbortErrors on web)
// and processLock (which logs noisy console.warn on acquireTimeout=0).
// Same semantics as processLock but without the console.warn noise.
const PROCESS_LOCKS: Record<string, Promise<unknown>> = {};

async function appLock<R>(
  name: string,
  acquireTimeout: number,
  fn: () => Promise<R>,
): Promise<R> {
  const prev = PROCESS_LOCKS[name] ?? Promise.resolve();
  const racePromises: Promise<unknown>[] = [prev.catch(() => null)];

  if (acquireTimeout >= 0) {
    racePromises.push(
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          const err = new Error(
            `Acquiring process lock with name "${name}" timed out`,
          );
          (err as Error & { isAcquireTimeout: boolean }).isAcquireTimeout = true;
          reject(err,
          );
        }, acquireTimeout);
      }),
    );
  }

  const current = Promise.race(racePromises)
    .catch((e: unknown) => {
      if (e && typeof e === 'object' && 'isAcquireTimeout' in e && e.isAcquireTimeout) {
        throw e;
      }
      return null;
    })
    .then(() => fn());

  PROCESS_LOCKS[name] = current.catch(async (e: unknown) => {
    if (e && typeof e === 'object' && 'isAcquireTimeout' in e && e.isAcquireTimeout) {
      await prev;
      return null;
    }
    throw e;
  });

  return await current;
}

const SecureStoreAdapter = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') {
      try {
        if (localStorage !== undefined) {
          return localStorage.getItem(key);
        }
      } catch {
        // localStorage not available
      }
      return null;
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      logger.warn('[SecureStore] Failed to get item:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      try {
        if (localStorage !== undefined) {
          localStorage.setItem(key, value);
        }
      } catch {
        // localStorage not available
      }
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      logger.warn('[SecureStore] Failed to set item:', error);
    }
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web') {
      try {
        if (localStorage !== undefined) {
          localStorage.removeItem(key);
        }
      } catch {
        // localStorage not available
      }
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      logger.warn('[SecureStore] Failed to remove item:', error);
    }
  },
};

const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// CRITICAL FIX: Validate env vars BEFORE creating client
// If env vars are missing or invalid, createClient will throw and crash the app
const isUrlValid = supabaseUrl && 
                   supabaseUrl !== 'MISSING_ENV_VAR' && 
                   supabaseUrl !== '' &&
                   supabaseUrl.startsWith('http') &&
                   supabaseUrl.length > 10;

const isKeyValid = supabaseAnonKey && 
                   supabaseAnonKey !== 'MISSING_ENV_VAR' && 
                   supabaseAnonKey !== '' &&
                   supabaseAnonKey.length > 10;

let supabaseClient;

// Check for missing or invalid environment variables
if (!isUrlValid || !isKeyValid) {
  const missingVars = [];
  if (!isUrlValid) missingVars.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!isKeyValid) missingVars.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  
  logger.error('[Supabase] Missing or invalid environment variables:', missingVars.join(', '));
  logger.error('[Supabase] For EAS builds, set these using: eas env:create production --name EXPO_PUBLIC_SUPABASE_URL --value <your-url> --visibility secret');
  logger.error('[Supabase] For EAS builds, set these using: eas env:create production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <your-key> --visibility secret');

  // CRITICAL FIX: Create a dummy client with placeholder values to prevent crashes
  // This allows the app to start and show the EnvCheck error screen
  // The client won't work, but it won't crash the app either
  try {
    supabaseClient = createClient(
      'https://placeholder.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
      {
        auth: {
          storage: SecureStoreAdapter,
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
        global: {
          headers: {
            'X-Client-Info': `expo-${Platform.OS}`,
          },
        },
        db: {
          schema: 'public',
        },
      }
    );
    // Mark the client as invalid so components can check
    // Type-safe property access via global.d.ts module augmentation
    supabaseClient.__isInvalid = true;
  } catch (error) {
    // Even creating dummy client failed - this should never happen, but handle it
    logger.error('[Supabase] Failed to create even dummy client:', error);
    // Create a minimal client that definitely won't throw
    supabaseClient = createClient('https://placeholder.supabase.co', 'dummy-key');
    // Type-safe property access via global.d.ts module augmentation
    supabaseClient.__isInvalid = true;
  }
} else {
  logger.info('[Supabase] Initializing client');
  logger.debug('[Supabase] URL:', supabaseUrl);
  logger.debug('[Supabase] Platform:', Platform.OS);

  try {
    supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          storage: SecureStoreAdapter,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
          // Use in-process lock to avoid navigator.locks AbortError on web
          // ("signal is aborted without reason").
          lock: appLock,
        },
        global: {
          headers: {
            'X-Client-Info': `expo-${Platform.OS}`,
          },
        },
        db: {
          schema: 'public',
        },
      }
    );
  } catch (error) {
    // Don't throw - create dummy client instead to prevent crash
    logger.error('[Supabase] Failed to create client with valid env vars, using placeholder:', error);
    try {
      supabaseClient = createClient(
        'https://placeholder.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
        {
          auth: {
            storage: SecureStoreAdapter,
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
          },
        }
      );
      // Type-safe property access via global.d.ts module augmentation
    supabaseClient.__isInvalid = true;
    } catch (fallbackError) {
      // Last resort - minimal client
      logger.error('[Supabase] Even fallback client creation failed:', fallbackError);
      supabaseClient = createClient('https://placeholder.supabase.co', 'dummy-key');
      // Type-safe property access via global.d.ts module augmentation
    supabaseClient.__isInvalid = true;
    }
  }
}

export const supabase = supabaseClient;
