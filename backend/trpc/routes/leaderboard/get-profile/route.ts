import { TRPCError } from '@trpc/server';

import { logger } from '../../../../../lib/logger.js';
import { supabaseAdmin } from '../../../../lib/auth.js';
import { protectedProcedure } from '../../../create-context.js';

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
