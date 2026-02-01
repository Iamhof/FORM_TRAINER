import { z } from 'zod';
import { protectedProcedure } from '../../../create-context.js';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth.js';
import { logger } from '@/lib/logger';

export const toggleScheduleDayProcedure = protectedProcedure
  .input(
    z.object({
      weekStart: z.string(),
      dayIndex: z.number().int().min(0).max(6),
      programmeId: z.string(),
      forceStatus: z.enum(['scheduled', 'rest', 'empty']).optional(),
      sessionId: z.string().nullable().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const { data, error } = await supabaseAdmin.rpc('toggle_schedule_day', {
      p_week_start: input.weekStart,
      p_day_index: input.dayIndex,
      p_programme_id: input.programmeId,
      p_force_status: input.forceStatus ?? null,
      p_session_id: input.sessionId ?? null,
    });

    if (error) {
      logger.error('[schedules.toggleDay] RPC error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to toggle schedule day',
      });
    }

    if (!data) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Schedule toggle returned no data',
      });
    }

    return data;
  });
