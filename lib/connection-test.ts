import { supabase } from './supabase';

export async function testSupabaseConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[ConnectionTest] Testing Supabase connection...');
    
    const { error } = await Promise.race([
      supabase.from('profiles').select('count').limit(0).maybeSingle(),
      new Promise<{ error: Error }>((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      ),
    ]);

    if (error) {
      console.error('[ConnectionTest] Connection test failed:', error.message);
      return { success: false, error: error.message };
    }

    console.log('[ConnectionTest] Connection successful');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ConnectionTest] Connection test exception:', message);
    return { 
      success: false, 
      error: message === 'Connection timeout' 
        ? 'Unable to reach server. Please check your internet connection.' 
        : message 
    };
  }
}
