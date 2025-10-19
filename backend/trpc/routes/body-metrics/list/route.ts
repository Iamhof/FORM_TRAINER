import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth';

export const listBodyMetricsProcedure = protectedProcedure
  .input(
    z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().optional(),
    })
  )
  .query(async ({ ctx, input }) => {
    let query = supabaseAdmin
      .from('body_metrics')
      .select('*')
      .eq('user_id', ctx.userId)
      .order('date', { ascending: false });

    if (input.startDate) {
      query = query.gte('date', input.startDate);
    }

    if (input.endDate) {
      query = query.lte('date', input.endDate);
    }

    if (input.limit) {
      query = query.limit(input.limit);
    }

    const { data: bodyMetrics, error } = await query;

    if (error) {
      console.error('[listBodyMetrics] Error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch body metrics',
      });
    }

    return bodyMetrics || [];
  });
