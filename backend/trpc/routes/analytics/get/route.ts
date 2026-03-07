import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { logger } from '../../../../../lib/logger.js';
import { supabaseAdmin } from '../../../../lib/auth.js';
import { protectedProcedure } from '../../../create-context.js';

// Date Validation: ISO8601 format with range and logic checks
const analyticsDateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
  .refine((date) => {
    const parsed = new Date(date);
    const minDate = new Date('2020-01-01'); // App launch date
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1); // Allow 1 year in future
    return !isNaN(parsed.getTime()) && parsed >= minDate && parsed <= maxDate;
  }, 'Date must be between 2020-01-01 and one year from now')
  .optional();

export const getAnalyticsProcedure = protectedProcedure
  .input(
    z.object({
      exerciseId: z.string().optional(),
      startDate: analyticsDateSchema,
      endDate: analyticsDateSchema,
    })
    .refine((data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    }, {
      message: 'End date must be after or equal to start date',
      path: ['endDate'],
    })
  )
  .query(async ({ ctx, input }) => {
    let query = supabaseAdmin
      .from('analytics')
      .select('*')
      .eq('user_id', ctx.userId)
      .order('date', { ascending: true });

    if (input.exerciseId) {
      query = query.eq('exercise_id', input.exerciseId);
    }

    if (input.startDate) {
      query = query.gte('date', input.startDate);
    }

    if (input.endDate) {
      query = query.lte('date', input.endDate);
    }

    const { data: analytics, error } = await query;

    if (error) {
      logger.error('Error fetching analytics:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch analytics',
      });
    }

    return analytics || [];
  });
