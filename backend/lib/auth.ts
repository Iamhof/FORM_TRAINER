import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../../lib/env.js';

export const assertServiceKeys = (context = 'backend/lib/auth') => {
  try {
    const validated = env;
    if (!validated.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
    }
  } catch (error) {
    throw new Error(
      `[${context}] ${error instanceof Error ? error.message : 'Environment validation failed'}`
    );
  }
};

// Lazy-loaded Supabase client to avoid cold start delays
let _supabaseAdmin: SupabaseClient | null = null;

export const getSupabaseAdmin = (): SupabaseClient => {
  if (!_supabaseAdmin) {
    assertServiceKeys('backend/lib/auth');
    _supabaseAdmin = createClient(
      env.EXPO_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return _supabaseAdmin;
};

// Keep backward compatibility - but now it's a getter
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabaseAdmin() as any)[prop];
  },
});

/**
 * SupabaseProfile - Backend database type
 * Uses snake_case to match database schema
 * This should be mapped to camelCase when returned to frontend via TRPC
 */
export type SupabaseProfile = {
  id: string;
  email: string | null;
  name: string | null;
  is_pt: boolean;
  role: string | null;
  accent_color: string | null; // DB field (snake_case) - Maps to accentColor in API responses
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  created_at: string | null;
  updated_at: string | null;
};

export const getProfileByUserId = async (
  userId: string
): Promise<SupabaseProfile | null> => {
  const [
    { data: profile, error: profileError },
    { data: authData, error: authError },
  ] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select(
        'user_id, name, is_pt, role, accent_color, gender, created_at, updated_at'
      )
      .eq('user_id', userId)
      .maybeSingle(),
    supabaseAdmin.auth.admin.getUserById(userId),
  ]);

  if (profileError) {
    throw new Error(
      `[getProfileByUserId] Failed to fetch profile for ${userId}: ${profileError.message}`
    );
  }

  if (authError) {
    throw new Error(
      `[getProfileByUserId] Failed to fetch auth user for ${userId}: ${authError.message}`
    );
  }

  const authUser = authData?.user ?? null;

  if (!profile && !authUser) {
    return null;
  }

  return {
    id: userId,
    email: authUser?.email ?? null,
    name: profile?.name ?? null,
    is_pt: profile?.is_pt ?? false,
    role: profile?.role ?? null,
    accent_color: profile?.accent_color ?? null,
    gender: profile?.gender ?? null,
    created_at: profile?.created_at ?? null,
    updated_at: profile?.updated_at ?? null,
  };
};

