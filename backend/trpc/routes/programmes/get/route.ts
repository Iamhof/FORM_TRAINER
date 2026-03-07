import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { supabaseAdmin } from '../../../../lib/auth.js';
import { protectedProcedure } from '../../../create-context.js';

export const getProgrammeProcedure = protectedProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ ctx, input }) => {
    const { data: programme, error } = await supabaseAdmin
      .from('programmes')
      .select('*')
      .eq('id', input.id)
      .eq('user_id', ctx.userId)
      .single();

    if (error || !programme) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Programme not found',
      });
    }

    return programme;
  });
