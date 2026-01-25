import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth';
import { logger } from '@/lib/logger';

export const getMyRankProcedure = protectedProcedure
  .input(
    z.object({
      type: z.enum(['total_volume', 'monthly_volume', 'total_sessions', 'monthly_sessions']),
      gender: z.enum(['all', 'male', 'female']).default('all'),
    })
  )
  .query(async ({ ctx, input }) => {
    logger.debug('[getMyRank] Fetching rank for user:', ctx.userId, input);

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

    // Count users with better value (higher rank)
    // Need to join with leaderboard_profiles to apply filters
    let countQuery = supabaseAdmin
      .from('leaderboard_stats')
      .select(`
        user_id,
        ${orderColumn},
        leaderboard_profiles!inner(
          is_opted_in,
          gender,
          ${privacyColumn}
        )
      `, { count: 'exact', head: true })
      .eq('leaderboard_profiles.is_opted_in', true)
      .eq(`leaderboard_profiles.${privacyColumn}`, true)
      .gt(orderColumn, userValue);

    if (input.gender !== 'all') {
      countQuery = countQuery.eq('leaderboard_profiles.gender', input.gender);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      logger.error('[getMyRank] Error counting rank:', countError);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to calculate rank',
      });
    }

    const rank = (count || 0) + 1;

    // Get total count for percentile calculation
    // Use the same join structure as the rankings query for accurate count
    let totalCountQuery = supabaseAdmin
      .from('leaderboard_stats')
      .select(`
        user_id,
        leaderboard_profiles!inner(
          is_opted_in,
          gender,
          ${privacyColumn}
        )
      `, { count: 'exact', head: true })
      .eq('leaderboard_profiles.is_opted_in', true)
      .eq(`leaderboard_profiles.${privacyColumn}`, true);

    if (input.gender !== 'all') {
      totalCountQuery = totalCountQuery.eq('leaderboard_profiles.gender', input.gender);
    }

    const { count: totalCount, error: totalCountError } = await totalCountQuery;

    // Calculate percentile: (total - rank) / total * 100
    let percentile = 0;
    if (!totalCountError && totalCount && totalCount > 0) {
      percentile = Math.round(((totalCount - rank + 1) / totalCount) * 100);
    }

    logger.debug('[getMyRank] User rank:', rank, 'Percentile:', percentile, 'Total:', totalCount);
    return {
      rank,
      value: userValue,
      type: input.type,
      percentile,
      total_count: totalCount || 0,
    };
  });
