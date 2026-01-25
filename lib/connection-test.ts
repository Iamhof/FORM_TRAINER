import { supabase } from './supabase';
import { logger } from './logger';

export async function testSupabaseConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    logger.debug('[ConnectionTest] Testing Supabase connection...');
    
    // Use a simple RPC call or auth endpoint that doesn't require RLS
    // This tests the connection without hitting RLS policies
    const { error } = await Promise.race([
      supabase.auth.getSession(),
      new Promise<{ error: Error }>((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      ),
    ]).catch((err) => {
      // If it's a timeout, return error structure
      if (err instanceof Error && err.message === 'Connection timeout') {
        return { error: err };
      }
      // For other errors, return success (session might be null, but connection works)
      return { error: null };
    }) as { error: any };

    if (error && error.message !== 'Connection timeout') {
      // Only fail on actual connection errors, not auth errors
      const errorMessage = error.message || String(error);
      if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('timeout')) {
        logger.error('[ConnectionTest] Connection test failed:', errorMessage);
        return { success: false, error: errorMessage };
      }
      // Auth errors are OK - it means we connected successfully
    }

    logger.debug('[ConnectionTest] Connection successful');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[ConnectionTest] Connection test exception:', message);
    return { 
      success: false, 
      error: message === 'Connection timeout' 
        ? 'Unable to reach server. Please check your internet connection.' 
        : message 
    };
  }
}
