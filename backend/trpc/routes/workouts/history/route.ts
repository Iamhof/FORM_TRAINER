import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth';

export const getWorkoutHistoryProcedure = protectedProcedure
  .input(
    z.object({
      programmeId: z.string().optional(),
      limit: z.number().optional(),
    })
  )
  .query(async ({ ctx, input }) => {
    let query = supabaseAdmin
      .from('workouts')
      .select('*')
      .eq('user_id', ctx.userId)
      .order('completed_at', { ascending: false });

    if (input.programmeId) {
      query = query.eq('programme_id', input.programmeId);
    }

    if (input.limit) {
      query = query.limit(input.limit);
    }

    const { data: workouts, error } = await query;

    if (error) {
      console.error('Error fetching workout history:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch workout history',
      });
    }

    return workouts || [];
  });
