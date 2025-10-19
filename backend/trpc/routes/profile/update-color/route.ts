import { protectedProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth';
import { z } from 'zod';

const updateColorSchema = z.object({
  accentColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format. Must be #RRGGBB'),
});

export const updateColorProcedure = protectedProcedure
  .input(updateColorSchema)
  .mutation(async ({ ctx, input }) => {
    console.log('[UPDATE_COLOR] Updating accent color for user:', ctx.userId, 'to:', input.accentColor);

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ accent_color: input.accentColor })
      .eq('user_id', ctx.userId)
      .select('accent_color')
      .single();

    if (error) {
      console.error('[UPDATE_COLOR] Error updating accent color:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update accent color',
      });
    }

    console.log('[UPDATE_COLOR] Accent color updated successfully:', data);

    return {
      accentColor: data.accent_color,
      success: true,
    };
  });
