import { z } from "zod";
import { protectedProcedure } from "../../../create-context.js";
import { supabaseAdmin } from "../../../../lib/auth.js";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import { logger } from '@/lib/logger';

export const inviteClientProcedure = protectedProcedure
  .input(
    z.object({
      email: z.string().email(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    logger.debug("[PT] Inviting client:", input.email);

    const { data: ptProfile, error: ptError } = await supabaseAdmin
      .from("pt_profile_view")
      .select("is_pt")
      .eq("id", ctx.userId)
      .single();

    if (ptError || !ptProfile?.is_pt) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only PTs can invite clients",
      });
    }

    const { data: existingInvite } = await supabaseAdmin
      .from("pt_invitations")
      .select("*")
      .eq("pt_id", ctx.userId)
      .eq("email", input.email)
      .eq("status", "pending")
      .single();

    if (existingInvite) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "An invitation is already pending for this email",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from("pt_invitations")
      .insert({
        pt_id: ctx.userId,
        email: input.email,
        token,
        status: "pending",
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (inviteError) {
      logger.error("[PT] Error creating invitation:", inviteError);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create invitation",
      });
    }

    logger.debug("[PT] Invitation created:", invitation.id);
    return { success: true, invitation };
  });
