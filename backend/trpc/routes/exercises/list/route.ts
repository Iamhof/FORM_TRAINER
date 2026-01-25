import { publicProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth';
import { logger } from '@/lib/logger';

export const listExercisesProcedure = publicProcedure.query(async () => {
  const { data: exercises, error } = await supabaseAdmin
    .from('exercises')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    logger.error('Error fetching exercises:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch exercises',
    });
  }

  return exercises || [];
});

