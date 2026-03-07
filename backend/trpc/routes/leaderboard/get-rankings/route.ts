import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { logger } from '../../../../../lib/logger.js';
import { supabaseAdmin } from '../../../../lib/auth.js';
import { publicProcedure } from '../../../create-context.js';
import { LEADERBOARD_COLUMN_MAPPINGS, leaderboardTypeSchema } from '../validation.js';

export const getLeaderboardRankingsProcedure = publicProcedure
  .input(
    z.object({
      type: leaderboardTypeSchema,
      gender: z.enum(['all', 'male', 'female']).default('all'),
      limit: z.number().min(10).max(100).default(50),
      offset: z.number().min(0).default(0),
    })
  )
  .query(async ({ ctx, input }) => {
    logger.debug('[getLeaderboardRankings] Fetching rankings:', input);

    // SQL Injection Protection: Use immutable const mapping instead of switch
    const { orderColumn, privacyColumn } = LEADERBOARD_COLUMN_MAPPINGS[input.type];

    // Get total count for pagination (separate query for efficiency)
    // Use the same join structure as the main query to get accurate count
    let countQuery = supabaseAdmin
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
      countQuery = countQuery.eq('leaderboard_profiles.gender', input.gender);
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      logger.error('[getLeaderboardRankings] Error getting count:', countError);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch leaderboard count',
      });
    }

    // Build main query with all needed fields
    let query = supabaseAdmin
      .from('leaderboard_stats')
      .select(`
        user_id,
        ${orderColumn},
        leaderboard_profiles!inner(
          display_name,
          show_real_name,
          gender,
          ${privacyColumn}
        ),
        profiles!inner(
          name,
          accent_color
        )
      `)
      .eq('leaderboard_profiles.is_opted_in', true)
      .eq(`leaderboard_profiles.${privacyColumn}`, true)
      .order(orderColumn, { ascending: false })
      .range(input.offset, input.offset + input.limit - 1);

    if (input.gender !== 'all') {
      query = query.eq('leaderboard_profiles.gender', input.gender);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('[getLeaderboardRankings] Error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch leaderboard rankings',
      });
    }

    // Map database snake_case to application camelCase for API response
    const rankings = data.map((entry: any, index) => ({
      rank: input.offset + index + 1,
      user_id: entry.user_id,
      display_name: entry.leaderboard_profiles.show_real_name 
        ? entry.profiles.name 
        : entry.leaderboard_profiles.display_name,
      value: entry[orderColumn],
      is_current_user: ctx.userId ? entry.user_id === ctx.userId : false,
      accentColor: entry.profiles.accent_color, // Map DB snake_case to API camelCase
    }));

    logger.debug('[getLeaderboardRankings] Returning', rankings.length, 'entries out of', totalCount || 0, 'total');
    return {
      entries: rankings,
      total_count: totalCount || 0,
      has_more: (input.offset + rankings.length) < (totalCount || 0),
    };
  });
