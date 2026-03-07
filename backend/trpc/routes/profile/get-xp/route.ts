import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { getLevelInfo, getLevelProgress } from '../../../../../constants/xp.js';
import { logger } from '../../../../../lib/logger.js';
import { supabaseAdmin } from '../../../../lib/auth.js';
import { protectedProcedure } from '../../../create-context.js';

export const getXPProcedure = protectedProcedure
  .input(
    z
      .object({
        includeHistory: z.boolean().optional().default(false),
        historyLimit: z.number().min(1).max(50).optional().default(10),
      })
      .optional()
  )
  .query(async ({ ctx, input }) => {
    const includeHistory = input?.includeHistory ?? false;
    const historyLimit = input?.historyLimit ?? 10;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('current_xp, current_level')
      .eq('user_id', ctx.userId)
      .single();

    if (profileError || !profile) {
      logger.error('[getXP] Error fetching profile XP', {
        userId: ctx.userId,
        error: profileError?.message,
      });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch XP data',
      });
    }

    const levelInfo = getLevelInfo(profile.current_level);
    const progress = getLevelProgress(profile.current_xp, profile.current_level);

    let history = null;
    if (includeHistory) {
      const { data: logs, error: logError } = await supabaseAdmin
        .from('xp_log')
        .select('id, action, xp_amount, source_id, metadata, created_at')
        .eq('user_id', ctx.userId)
        .order('created_at', { ascending: false })
        .limit(historyLimit);

      if (logError) {
        logger.error('[getXP] Error fetching XP history', {
          userId: ctx.userId,
          error: logError.message,
        });
      } else {
        history = logs;
      }
    }

    return {
      currentXp: profile.current_xp,
      currentLevel: profile.current_level,
      levelTitle: levelInfo.title,
      progress,
      history,
    };
  });
