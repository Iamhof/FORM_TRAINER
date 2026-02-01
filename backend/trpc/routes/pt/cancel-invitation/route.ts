import { z } from 'zod';
import { protectedProcedure } from '../../../create-context.js';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth.js';
import { logger } from '@/lib/logger';

export const cancelInvitationProcedure = protectedProcedure
  .input(
    z.object({
      invitationId: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { data: invitation, error } = await supabaseAdmin
      .from('pt_invitations')
      .select('id')
      .eq('id', input.invitationId)
      .eq('pt_id', ctx.userId)
      .eq('status', 'pending')
      .maybeSingle();

    if (error) {
      logger.error('[PT] Error verifying invitation for cancel:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to load invitation',
      });
    }

    if (!invitation) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Invitation not found or already actioned',
      });
    }

    const { error: updateError } = await supabaseAdmin
      .from('pt_invitations')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    if (updateError) {
      logger.error('[PT] Error cancelling invitation:', updateError);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to cancel invitation',
      });
    }

    return { success: true };
  });
