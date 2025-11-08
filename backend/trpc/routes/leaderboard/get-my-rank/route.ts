import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth';

export const getMyRankProcedure = protectedProcedure
  .input(
    z.object({
      type: z.enum(['total_volume', 'monthly_volume', 'total_sessions', 'monthly_sessions']),
      gender: z.enum(['all', 'male', 'female']).default('all'),
    })
  )
  .query(async ({ ctx, input }) => {
    console.log('[getMyRank] Fetching rank for user:', ctx.userId, input);

    let orderColumn: string;
    let privacyColumn: string;

    switch (input.type) {
      case 'total_volume':
        orderColumn = 'total_volume_kg';
        privacyColumn = 'show_in_total_volume';
        break;
      case 'monthly_volume':
        orderColumn = 'monthly_volume_kg';
        privacyColumn = 'show_in_monthly_volume';
        break;
      case 'total_sessions':
        orderColumn = 'total_sessions';
        privacyColumn = 'show_in_total_sessions';
        break;
      case 'monthly_sessions':
        orderColumn = 'monthly_sessions';
        privacyColumn = 'show_in_monthly_sessions';
        break;
    }

    const { data: userStats, error: userError } = await supabaseAdmin
      .from('leaderboard_stats')
      .select(orderColumn)
      .eq('user_id', ctx.userId)
      .single();

    if (userError || !userStats) {
      return null;
    }

    const userValue = (userStats as any)[orderColumn];

    let countQuery = supabaseAdmin
      .from('leaderboard_stats')
      .select('user_id', { count: 'exact', head: true })
      .eq('leaderboard_profiles.is_opted_in', true)
      .eq(`leaderboard_profiles.${privacyColumn}`, true)
      .gt(orderColumn, userValue);

    if (input.gender !== 'all') {
      countQuery = countQuery.eq('leaderboard_profiles.gender', input.gender);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('[getMyRank] Error counting rank:', countError);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to calculate rank',
      });
    }

    const rank = (count || 0) + 1;

    console.log('[getMyRank] User rank:', rank);
    return {
      rank,
      value: userValue,
      type: input.type,
    };
  });
