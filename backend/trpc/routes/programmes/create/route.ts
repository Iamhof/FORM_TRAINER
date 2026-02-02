import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { supabaseAdmin } from '../../../../lib/auth.js';
import { protectedProcedure } from '../../../create-context.js';
import { logger } from '../../../../../lib/logger.js';


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

    // Log incoming request
    logger.info('[Programme] Create request received', {
      userId: ctx.userId,
      programmeName: name,
      daysCount: days,
      weeksCount: weeks,
      exercisesCount: exercises.length,
    });

    // Check for duplicate programme name for this user
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('programmes')
      .select('id')
      .eq('user_id', ctx.userId)
      .eq('name', name)
      .maybeSingle();

    if (checkError) {
      logger.error('[Programme] Error checking for duplicate name', {
        userId: ctx.userId,
        error: checkError.message,
        code: checkError.code,
      });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Database error while checking name: ${checkError.message}`,
      });
    }

    if (existing) {
      logger.warn('[Programme] Duplicate name rejected', {
        userId: ctx.userId,
        programmeName: name,
        existingId: existing.id,
      });
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

    if (error) {
      logger.error('[Programme] Database error creating programme', {
        userId: ctx.userId,
        error: error.message,
        code: error.code,
        details: error.details,
      });

      // Handle specific database errors
      if (error.code === '23505') {
        // Unique violation (race condition on duplicate name)
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A programme with this name already exists',
        });
      }

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Database error: ${error.message}`,
      });
    }

    if (!programme) {
      logger.error('[Programme] Programme was not returned after insert', {
        userId: ctx.userId,
        programmeName: name,
      });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Programme was not returned after insert',
      });
    }

    logger.info('[Programme] Created successfully', {
      programmeId: programme.id,
      userId: ctx.userId,
      programmeName: name,
    });

    return programme;
  });
