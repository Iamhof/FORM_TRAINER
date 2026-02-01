import { protectedProcedure } from '../../../create-context.js';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth.js';
import { logger } from '@/lib/logger';

export const getLeaderboardProfileProcedure = protectedProcedure.query(async ({ ctx }) => {
  logger.debug('[getLeaderboardProfile] Fetching profile for user:', ctx.userId);

  const { data, error } = await supabaseAdmin
    .from('leaderboard_profiles')
    .select('*')
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (error) {
    logger.error('[getLeaderboardProfile] Error:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch leaderboard profile',
    });
  }

  return data;
});
