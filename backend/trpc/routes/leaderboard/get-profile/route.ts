import { protectedProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth';

export const getLeaderboardProfileProcedure = protectedProcedure.query(async ({ ctx }) => {
  console.log('[getLeaderboardProfile] Fetching profile for user:', ctx.userId);

  const { data, error } = await supabaseAdmin
    .from('leaderboard_profiles')
    .select('*')
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (error) {
    console.error('[getLeaderboardProfile] Error:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch leaderboard profile',
    });
  }

  return data;
});
