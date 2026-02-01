import { z } from 'zod';
import { protectedProcedure } from '../../../create-context.js';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth.js';
import { logger } from '@/lib/logger';

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
