import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth';

export const listPersonalRecordsProcedure = protectedProcedure
  .input(
    z.object({
      exerciseId: z.string().optional(),
    })
  )
  .query(async ({ ctx, input }) => {
    let query = supabaseAdmin
      .from('personal_records')
      .select('*')
      .eq('user_id', ctx.userId)
      .order('date', { ascending: false });

    if (input.exerciseId) {
      query = query.eq('exercise_id', input.exerciseId);
    }

    const { data: personalRecords, error } = await query;

    if (error) {
      console.error('[listPersonalRecords] Error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch personal records',
      });
    }

    return personalRecords || [];
  });
