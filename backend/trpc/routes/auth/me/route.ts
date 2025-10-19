import { protectedProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth';

export const meProcedure = protectedProcedure.query(async ({ ctx }) => {
  console.log('[ME] Fetching profile for user:', ctx.userId);
  
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('name, role, is_pt, accent_color, created_at, updated_at')
    .eq('user_id', ctx.userId)
    .single();

  if (error) {
    console.error('[ME] Error fetching profile:', error);
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Profile not found',
    });
  }

  console.log('[ME] Profile found:', profile);
  
  return {
    id: ctx.userId,
    email: ctx.userEmail || '',
    name: profile.name,
    is_pt: profile.is_pt,
    role: profile.role,
    accentColor: profile.accent_color || '#A855F7',
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
});
