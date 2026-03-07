import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { logger } from '../../../../../lib/logger.js';
import { supabaseAdmin } from '../../../../lib/auth.js';
import { protectedProcedure } from '../../../create-context.js';

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
      logger.error('[deleteBodyMetrics] Error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete body metrics',
      });
    }

    logger.debug('[deleteBodyMetrics] Successfully deleted body metric:', input.id);
    return { success: true };
  });
