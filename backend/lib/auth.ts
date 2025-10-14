import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Missing Supabase environment variables. Backend operations may fail.');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export interface SupabaseUser {
  id: string;
  email: string;
}

export async function verifySupabaseToken(token: string): Promise<SupabaseUser | null> {
  try {
    console.log('[AUTH] Verifying Supabase token...');
    
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error) {
      console.error('[AUTH] Token verification error:', error.message);
      return null;
    }
    
    if (!user) {
      console.log('[AUTH] No user found for token');
      return null;
    }
    
    console.log('[AUTH] Token verified for user:', user.id);
    return {
      id: user.id,
      email: user.email || '',
    };
  } catch (error) {
    console.error('[AUTH] Token verification failed:', error);
    return null;
  }
}
