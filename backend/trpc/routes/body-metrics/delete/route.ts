import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth';

export const deleteBodyMetricsProcedure = protectedProcedure
  .input(
    z.object({
      id: z.string().uuid(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { error } = await supabaseAdmin
      .from('body_metrics')
      .delete()
      .eq('id', input.id)
      .eq('user_id', ctx.userId);

    if (error) {
      console.error('[deleteBodyMetrics] Error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete body metrics',
      });
    }

    console.log('[deleteBodyMetrics] Successfully deleted body metric:', input.id);
    return { success: true };
  });
