import { protectedProcedure } from "../../../create-context.js";
import { supabaseAdmin } from "../../../../lib/auth.js";
import { TRPCError } from "@trpc/server";
import { logger } from '../../../../../lib/logger.js';

export const listInvitationsProcedure = protectedProcedure.query(
  async ({ ctx }) => {
    logger.debug("[PT] Listing invitations for PT:", ctx.userId);

    const { data: ptProfile, error: ptError } = await supabaseAdmin
      .from("pt_profile_view")
      .select("is_pt")
      .eq("id", ctx.userId)
      .single();

    if (ptError || !ptProfile?.is_pt) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only PTs can view invitations",
      });
    }

    const { data: invitations, error } = await supabaseAdmin
      .from("pt_invitations")
      .select("*")
      .eq("pt_id", ctx.userId)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("[PT] Error fetching invitations:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch invitations",
      });
    }

    return (invitations ?? [])
      .filter((invitation) => invitation.status === 'pending')
      .map((invitation) => ({
        id: invitation.id,
        clientEmail: invitation.email,
        status: invitation.status,
        createdAt: invitation.created_at,
        expiresAt: invitation.expires_at,
      }));
  }
);
