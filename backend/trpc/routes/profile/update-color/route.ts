import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { logger } from '../../../../../lib/logger.js';
import { supabaseAdmin } from '../../../../lib/auth.js';
import { awardXP } from '../../../../services/xp.service.js';
import { protectedProcedure } from '../../../create-context.js';

const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format. Must be #RRGGBB');

export const updateColorProcedure = protectedProcedure
  .input(z.object({
    color: hexColorSchema,
  }))
  .mutation(async ({ ctx, input }) => {
    logger.debug('[UPDATE_COLOR] Updating accent color for user:', ctx.userId, 'to:', input.color);
    
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ accent_color: input.color })
      .eq('user_id', ctx.userId);

    if (error) {
      logger.error('[UPDATE_COLOR] Error updating color:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update accent color',
      });
    }

    logger.debug('[UPDATE_COLOR] Color updated successfully');

    // Award XP for first color change (one-time action, non-blocking on failure)
    const xpResult = await awardXP(ctx.userId, 'CHANGE_COLOR');

    return {
      success: true,
      color: input.color,
      xp: xpResult.awarded
        ? {
            awarded: xpResult.xp_awarded,
            newXp: xpResult.new_xp,
            newLevel: xpResult.new_level,
            leveledUp: xpResult.leveled_up,
          }
        : null,
    };
  });
