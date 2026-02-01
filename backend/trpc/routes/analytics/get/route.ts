import { z } from 'zod';
import { protectedProcedure } from '../../../create-context.js';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth.js';
import { logger } from '@/lib/logger';

export const getAnalyticsProcedure = protectedProcedure
  .input(
    z.object({
      exerciseId: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  )
  .query(async ({ ctx, input }) => {
    let query = supabaseAdmin
      .from('analytics')
      .select('*')
      .eq('user_id', ctx.userId)
      .order('date', { ascending: true });

    if (input.exerciseId) {
      query = query.eq('exercise_id', input.exerciseId);
    }

    if (input.startDate) {
      query = query.gte('date', input.startDate);
    }

    if (input.endDate) {
      query = query.lte('date', input.endDate);
    }

    const { data: analytics, error } = await query;

    if (error) {
      logger.error('Error fetching analytics:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch analytics',
      });
    }

    return analytics || [];
  });
