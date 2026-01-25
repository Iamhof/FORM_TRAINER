import { z } from 'zod';
import { logger } from './logger';

const envSchema = z.object({
  // Client-side (must start with EXPO_PUBLIC_)
  EXPO_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key required'),
  EXPO_PUBLIC_RORK_API_BASE_URL: z.string().url().optional(),
  EXPO_PUBLIC_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),
  EXPO_PUBLIC_WEB_URL: z.string().url().optional(),
  EXPO_PUBLIC_TRPC_TIMEOUT: z.string().regex(/^\d+$/, 'TRPC timeout must be a number in milliseconds').optional(),
  
  // Server-side only
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Service role key required').optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

export function validateEnv(): Env {
  if (validatedEnv) return validatedEnv;
  
  try {
    validatedEnv = envSchema.parse({
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      EXPO_PUBLIC_RORK_API_BASE_URL: process.env.EXPO_PUBLIC_RORK_API_BASE_URL,
      EXPO_PUBLIC_LOG_LEVEL: process.env.EXPO_PUBLIC_LOG_LEVEL,
      EXPO_PUBLIC_WEB_URL: process.env.EXPO_PUBLIC_WEB_URL,
      EXPO_PUBLIC_TRPC_TIMEOUT: process.env.EXPO_PUBLIC_TRPC_TIMEOUT,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      NODE_ENV: process.env.NODE_ENV || 'development',
    });
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors
        .map(e => `${e.path.join('.')}: ${e.message}`)
        .join('\n');
      throw new Error(`Environment validation failed:\n${missing}`);
    }
    throw error;
  }
}

// Validate on import (client-side)
// Always try to validate, catch errors gracefully
try {
  validateEnv();
} catch (error) {
  // Only log in non-test environments to avoid noise in tests
  if (process.env.NODE_ENV !== 'test') {
    logger.error('[Env] Validation failed:', error);
  }
  // Don't throw - let app handle gracefully
}

// Safe export: If validation fails, provide a fallback that will cause graceful errors
// instead of crashing the entire app on module import
let envExport: Env;
try {
  envExport = validateEnv();
} catch (error) {
  // CRITICAL FIX: Instead of throwing (which crashes the app), provide a fallback
  // This allows the app to start and show an error message via ErrorBoundary
  // The fallback values will cause Supabase initialization to fail gracefully
  const errorMessage = error instanceof Error ? error.message : 'Environment validation failed';
  logger.error('[Env] Using fallback due to validation failure:', errorMessage);
  
  // Provide fallback values that will cause clear errors downstream
  envExport = {
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'MISSING_ENV_VAR',
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'MISSING_ENV_VAR',
    EXPO_PUBLIC_RORK_API_BASE_URL: process.env.EXPO_PUBLIC_RORK_API_BASE_URL,
    EXPO_PUBLIC_LOG_LEVEL: process.env.EXPO_PUBLIC_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error' | undefined,
    EXPO_PUBLIC_WEB_URL: process.env.EXPO_PUBLIC_WEB_URL,
    EXPO_PUBLIC_TRPC_TIMEOUT: process.env.EXPO_PUBLIC_TRPC_TIMEOUT,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  } as Env;
}

export const env = envExport;

