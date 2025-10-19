import { protectedProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth';

export const getLatestBodyMetricsProcedure = protectedProcedure.query(async ({ ctx }) => {
  const { data: bodyMetric, error } = await supabaseAdmin
    .from('body_metrics')
    .select('*')
    .eq('user_id', ctx.userId)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('[getLatestBodyMetrics] Error:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch latest body metrics',
    });
  }

  return bodyMetric || null;
});
