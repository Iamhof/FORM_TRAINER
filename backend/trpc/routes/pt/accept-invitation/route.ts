import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { supabaseAdmin } from "../../../../lib/auth";
import { TRPCError } from "@trpc/server";
import { logger } from '@/lib/logger';

export const acceptInvitationProcedure = protectedProcedure
  .input(
    z.object({
      token: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    logger.debug("[PT] Accepting invitation with token");

    const { data: profile } = await supabaseAdmin
      .from("pt_profile_view")
      .select("email")
      .eq("id", ctx.userId)
      .single();

    if (!profile || !profile.email) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from("pt_invitations")
      .select("*")
      .eq("token", input.token)
      .eq("email", profile.email)
      .eq("status", "pending")
      .single();

    if (inviteError || !invitation) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Invalid or expired invitation",
      });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      await supabaseAdmin
        .from("pt_invitations")
        .update({ status: "expired" })
        .eq("id", invitation.id);

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invitation has expired",
      });
    }

    const { data: existingRelationship } = await supabaseAdmin
      .from("pt_client_relationships")
      .select("*")
      .eq("pt_id", invitation.pt_id)
      .eq("client_id", ctx.userId)
      .single();

    if (existingRelationship) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Relationship already exists",
      });
    }

    const { data: relationship, error: relationshipError } = await supabaseAdmin
      .from("pt_client_relationships")
      .insert({
        pt_id: invitation.pt_id,
        client_id: ctx.userId,
        status: "active",
      })
      .select()
      .single();

    if (relationshipError) {
      logger.error("[PT] Error creating relationship:", relationshipError);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create relationship",
      });
    }

    await supabaseAdmin
      .from("pt_invitations")
      .update({ status: "accepted" })
      .eq("id", invitation.id);

    logger.debug("[PT] Relationship created:", relationship.id);
    return { success: true, relationship };
  });
