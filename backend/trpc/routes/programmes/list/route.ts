import { TRPCError } from '@trpc/server';

import { logger } from '../../../../../lib/logger.js';
import { supabaseAdmin } from '../../../../lib/auth.js';
import { protectedProcedure } from '../../../create-context.js';

export const listProgrammesProcedure = protectedProcedure.query(async ({ ctx }) => {
  const { data: programmes, error } = await supabaseAdmin
    .from('programmes')
    .select('*')
    .eq('user_id', ctx.userId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching programmes:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch programmes',
    });
  }

  return programmes || [];
});
