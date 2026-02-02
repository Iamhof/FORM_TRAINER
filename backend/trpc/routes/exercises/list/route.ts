import { publicProcedure } from '../../../create-context.js';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth.js';
import { logger } from '../../../../../lib/logger.js';

export const listExercisesProcedure = publicProcedure.query(async () => {
  logger.info('[Exercises] Fetching exercises list');

  try {
    const { data: exercises, error } = await supabaseAdmin
      .from('exercises')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      logger.error('[Exercises] Database error fetching exercises:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Database error: ${error.message}`,
      });
    }

    logger.info('[Exercises] Successfully fetched exercises', {
      count: exercises?.length ?? 0,
    });

    return exercises || [];
  } catch (err) {
    // Catch any unexpected errors (e.g., supabaseAdmin initialization failure)
    if (err instanceof TRPCError) {
      throw err;
    }

    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[Exercises] Unexpected error:', {
      message: errorMessage,
      stack: err instanceof Error ? err.stack : undefined,
    });

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Unexpected error: ${errorMessage}`,
    });
  }
});

