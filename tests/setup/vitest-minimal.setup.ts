/**
 * MINIMAL VITEST SETUP - For Security Pen-Tests
 *
 * Stripped-down setup that avoids the "typeof" transformation issues
 * in the full vitest.setup.ts file.
 */

import { vi } from 'vitest';

// Set test environment variables
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-key';
(process.env as Record<string, string | undefined>)['NODE_ENV'] = 'test';

// Define React Native global for test environment
(global as any).__DEV__ = true;

// Mock logger (minimal - avoids typeof issues)
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    sanitize: (data: any) => data,
  },
}));

// Mock env (minimal)
vi.mock('@/lib/env', () => ({
  env: {
    EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    EXPO_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-test-key',
    NODE_ENV: 'test',
  },
  validateEnv: () => ({
    EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    EXPO_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-test-key',
    NODE_ENV: 'test',
  }),
}));

// Mock backend auth (minimal - pen-tests will override in beforeEach)
vi.mock('@/backend/lib/auth', () => ({
  supabaseAdmin: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
  assertServiceKeys: vi.fn(),
}));
