import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth';

export const updateLeaderboardProfileProcedure = protectedProcedure
  .input(
    z.object({
      is_opted_in: z.boolean().optional(),
      display_name: z.string().min(1).max(50).optional(),
      show_real_name: z.boolean().optional(),
      gender: z.enum(['male', 'female']).optional(),
      show_in_total_volume: z.boolean().optional(),
      show_in_monthly_volume: z.boolean().optional(),
      show_in_total_sessions: z.boolean().optional(),
      show_in_monthly_sessions: z.boolean().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    console.log('[updateLeaderboardProfile] Updating profile:', {
      userId: ctx.userId,
      input,
    });

    const updates: Record<string, any> = {};
    if (input.is_opted_in !== undefined) updates.is_opted_in = input.is_opted_in;
    if (input.display_name !== undefined) updates.display_name = input.display_name;
    if (input.show_real_name !== undefined) updates.show_real_name = input.show_real_name;
    if (input.gender !== undefined) updates.gender = input.gender;
    if (input.show_in_total_volume !== undefined) updates.show_in_total_volume = input.show_in_total_volume;
    if (input.show_in_monthly_volume !== undefined) updates.show_in_monthly_volume = input.show_in_monthly_volume;
    if (input.show_in_total_sessions !== undefined) updates.show_in_total_sessions = input.show_in_total_sessions;
    if (input.show_in_monthly_sessions !== undefined) updates.show_in_monthly_sessions = input.show_in_monthly_sessions;

    if (Object.keys(updates).length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No updates provided',
      });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('leaderboard_profiles')
      .upsert({
        user_id: ctx.userId,
        ...updates,
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) {
      console.error('[updateLeaderboardProfile] Error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update leaderboard profile',
      });
    }

    console.log('[updateLeaderboardProfile] Success');
    return data;
  });
