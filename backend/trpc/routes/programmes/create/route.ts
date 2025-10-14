import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth';

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
      console.error('Error creating programme:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create programme',
      });
    }

    return programme;
  });
