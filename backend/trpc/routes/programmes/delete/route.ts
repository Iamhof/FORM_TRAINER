import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { logger } from '../../../../../lib/logger.js';
import { supabaseAdmin } from '../../../../lib/auth.js';
import { protectedProcedure } from '../../../create-context.js';

export const deleteProgrammeProcedure = protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const { error } = await supabaseAdmin
      .from('programmes')
      .delete()
      .eq('id', input.id)
      .eq('user_id', ctx.userId);

    if (error) {
      logger.error('Error deleting programme:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete programme',
      });
    }

    return { success: true };
  });
