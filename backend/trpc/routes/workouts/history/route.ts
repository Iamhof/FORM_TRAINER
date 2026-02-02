import { z } from 'zod';
import { protectedProcedure } from '../../../create-context.js';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth.js';
import { logger } from '../../../../../lib/logger.js';

export const getWorkoutHistoryProcedure = protectedProcedure
  .input(
    z.object({
      programmeId: z.string().optional(),
      limit: z.number().optional(),
    })
  )
  .query(async ({ ctx, input }) => {
    logger.info('[Workout] History request', {
      userId: ctx.userId,
      programmeId: input.programmeId,
      limit: input.limit,
    });

    try {
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
        logger.error('[Workout] Database error fetching history', {
          userId: ctx.userId,
          error: error.message,
          code: error.code,
          details: error.details,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Database error: ${error.message}`,
        });
      }

      logger.info('[Workout] History fetched', {
        userId: ctx.userId,
        count: workouts?.length ?? 0,
      });

      return workouts || [];
    } catch (err) {
      if (err instanceof TRPCError) {
        throw err;
      }

      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('[Workout] Unexpected error fetching history', {
        userId: ctx.userId,
        message: errorMessage,
        stack: err instanceof Error ? err.stack : undefined,
      });

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Unexpected error: ${errorMessage}`,
      });
    }
  });
