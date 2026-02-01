import { z } from 'zod';
import { protectedProcedure } from '../../../create-context.js';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth.js';
import { logger } from '@/lib/logger';

const exerciseSchema = z.object({
  day: z.number(),
  exerciseId: z.string(),
  sets: z.number(),
  reps: z.string(),
  rest: z.number(),
});

export const createProgrammeProcedure = protectedProcedure
  .input(
    z.object({
      name: z.string().min(1),
      days: z.number().min(1),
      weeks: z.number().min(1),
      exercises: z.array(exerciseSchema),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { name, days, weeks, exercises } = input;

    // Check for duplicate programme name for this user
    const { data: existing } = await supabaseAdmin
      .from('programmes')
      .select('id')
      .eq('user_id', ctx.userId)
      .eq('name', name)
      .maybeSingle();

    if (existing) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'A programme with this name already exists',
      });
    }

    const { data: programme, error } = await supabaseAdmin
      .from('programmes')
      .insert({
        user_id: ctx.userId,
        name,
        days,
        weeks,
        exercises,
      })
      .select()
      .single();

    if (error || !programme) {
      logger.error('Error creating programme:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create programme',
      });
    }

    return programme;
  });
