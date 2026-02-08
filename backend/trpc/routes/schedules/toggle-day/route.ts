import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { logger } from '../../../../../lib/logger.js';
import { supabaseAdmin } from '../../../../lib/auth.js';
import { protectedProcedure } from '../../../create-context.js';

export const toggleScheduleDayProcedure = protectedProcedure
  .input(
    z.object({
      weekStart: z.string(),
      dayIndex: z.number().int().min(0).max(6),
      programmeId: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    // Fetch programme to enforce max training days
    const { data: programme, error: progError } = await supabaseAdmin
      .from('programmes')
      .select('days')
      .eq('id', input.programmeId)
      .single();

    if (progError || !programme) {
      logger.error('[schedules.toggleDay] Programme lookup failed:', progError);
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Programme not found',
      });
    }

    const maxDays: number = programme.days;

    // Fetch existing schedule for this user + week
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('schedules')
      .select('*')
      .eq('user_id', ctx.userId)
      .eq('week_start', input.weekStart)
      .maybeSingle();

    if (fetchError) {
      logger.error('[schedules.toggleDay] Fetch error:', fetchError);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch schedule',
      });
    }

    // Build schedule array from existing row or create default
    let schedule: any[];

    if (existing) {
      schedule = Array.isArray(existing.schedule)
        ? existing.schedule
        : JSON.parse(existing.schedule as string);
    } else {
      schedule = Array.from({ length: 7 }, (_, i) => ({
        dayOfWeek: i,
        status: 'empty',
        sessionId: null,
        weekStart: input.weekStart,
      }));
    }

    // Toggle the day status
    const currentStatus = schedule[input.dayIndex]?.status;

    if (currentStatus === 'scheduled') {
      schedule[input.dayIndex] = {
        ...schedule[input.dayIndex],
        status: 'rest',
        sessionId: null,
      };
    } else {
      const scheduledCount = schedule.filter(
        (d: any) => d.status === 'scheduled'
      ).length;

      if (scheduledCount >= maxDays) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Maximum scheduled sessions reached',
        });
      }

      schedule[input.dayIndex] = {
        ...schedule[input.dayIndex],
        status: 'scheduled',
        sessionId: null,
      };
    }

    // Upsert: update existing row or insert new one
    if (existing) {
      const { error } = await supabaseAdmin
        .from('schedules')
        .update({
          schedule,
          programme_id: input.programmeId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) {
        logger.error('[schedules.toggleDay] Update error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update schedule: ${error.message}`,
        });
      }
    } else {
      const { error } = await supabaseAdmin.from('schedules').insert({
        user_id: ctx.userId,
        programme_id: input.programmeId,
        week_start: input.weekStart,
        schedule,
      });

      if (error) {
        logger.error('[schedules.toggleDay] Insert error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create schedule: ${error.message}`,
        });
      }
    }

    return { success: true, schedule };
  });
