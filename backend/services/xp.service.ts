import { XP_AMOUNTS, type XPAction } from '../../constants/xp.js';
import { logger } from '../../lib/logger.js';
import { supabaseAdmin } from '../lib/auth.js';

export interface AwardXPResult {
  awarded: boolean;
  reason?: string;
  xp_awarded?: number;
  new_xp?: number;
  previous_xp?: number;
  new_level?: number;
  previous_level?: number;
  leveled_up?: boolean;
  existing_xp?: number;
  existing_level?: number;
}

/**
 * Award XP to a user via the atomic RPC function.
 * Non-blocking on failure: returns { awarded: false } instead of throwing.
 */
export async function awardXP(
  userId: string,
  action: XPAction,
  sourceId?: string,
  metadata?: Record<string, unknown>
): Promise<AwardXPResult> {
  const xpAmount = XP_AMOUNTS[action];

  logger.info('[XP] Awarding XP', {
    userId,
    action,
    xpAmount,
    sourceId: sourceId ?? 'none',
  });

  try {
    const { data, error } = await supabaseAdmin.rpc('award_xp_transaction', {
      p_user_id: userId,
      p_action: action,
      p_xp_amount: xpAmount,
      p_source_id: sourceId ?? null,
      p_metadata: metadata ?? {},
    });

    if (error) {
      logger.error('[XP] RPC error awarding XP', {
        userId,
        action,
        error: error.message,
        code: error.code,
      });
      return { awarded: false, reason: error.message };
    }

    const result = data as AwardXPResult;

    if (result.awarded) {
      logger.info('[XP] XP awarded successfully', {
        userId,
        action,
        xpAwarded: result.xp_awarded,
        newXp: result.new_xp,
        newLevel: result.new_level,
        leveledUp: result.leveled_up,
      });
    } else {
      logger.debug('[XP] XP not awarded (idempotent)', {
        userId,
        action,
        reason: result.reason,
      });
    }

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[XP] Unexpected error awarding XP', { userId, action, message });
    return { awarded: false, reason: message };
  }
}
