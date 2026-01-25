import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth';
import { randomBytes } from 'crypto';
import { logger } from '@/lib/logger';

export const resendInvitationProcedure = protectedProcedure
  .input(
    z.object({
      invitationId: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { data: invitation, error } = await supabaseAdmin
      .from('pt_invitations')
      .select('*')
      .eq('id', input.invitationId)
      .eq('pt_id', ctx.userId)
      .eq('status', 'pending')
      .maybeSingle();

    if (error) {
      logger.error('[PT] Error fetching invitation for resend:', error);
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

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: updateError } = await supabaseAdmin
      .from('pt_invitations')
      .update({
        token,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    if (updateError) {
      logger.error('[PT] Error resending invitation:', updateError);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to resend invitation',
      });
    }

    return { success: true };
  });
