import { TRPCError } from '@trpc/server';

import { logger } from '../../../../../lib/logger.js';
import { supabaseAdmin } from '../../../../lib/auth.js';
import { protectedProcedure } from '../../../create-context.js';

export const deleteAccountProcedure = protectedProcedure
  .mutation(async ({ ctx }) => {
    const userId = ctx.userId;

    logger.info('[auth.deleteAccount] Initiating account deletion', { userId });

    // Step 1: Delete all user data via cascade RPC
    const { error: dataError } = await supabaseAdmin.rpc('delete_user_data', {
      p_user_id: userId,
    });

    if (dataError) {
      logger.error('[auth.deleteAccount] Failed to delete user data', { userId, error: dataError });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete account data. Please try again.',
      });
    }

    // Step 2: Delete the auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      logger.error('[auth.deleteAccount] Failed to delete auth user', { userId, error: authError });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete account. Please contact support.',
      });
    }

    logger.info('[auth.deleteAccount] Account deleted successfully', { userId });

    return { success: true };
  });
