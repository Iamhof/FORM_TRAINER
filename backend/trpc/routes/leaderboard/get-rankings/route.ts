import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth';

export const getLeaderboardRankingsProcedure = publicProcedure
  .input(
    z.object({
      type: z.enum(['total_volume', 'monthly_volume', 'total_sessions', 'monthly_sessions']),
      gender: z.enum(['all', 'male', 'female']).default('all'),
      limit: z.number().min(10).max(100).default(50),
      offset: z.number().min(0).default(0),
    })
  )
  .query(async ({ ctx, input }) => {
    console.log('[getLeaderboardRankings] Fetching rankings:', input);

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
      console.error('[getLeaderboardRankings] Error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch leaderboard rankings',
      });
    }

    const rankings = data.map((entry: any, index) => ({
      rank: input.offset + index + 1,
      user_id: entry.user_id,
      display_name: entry.leaderboard_profiles.show_real_name 
        ? entry.profiles.name 
        : entry.leaderboard_profiles.display_name,
      value: entry[orderColumn],
      is_current_user: ctx.userId ? entry.user_id === ctx.userId : false,
      accent_color: entry.profiles.accent_color,
    }));

    console.log('[getLeaderboardRankings] Returning', rankings.length, 'entries');
    return rankings;
  });
