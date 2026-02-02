import { z } from "zod";
import { protectedProcedure } from "../../../create-context.js";
import { supabaseAdmin } from "../../../../lib/auth.js";
import { TRPCError } from "@trpc/server";
import { logger } from '../../../../../lib/logger.js';

export const shareProgrammeProcedure = protectedProcedure
  .input(
    z.object({
      programmeId: z.string(),
      clientId: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    logger.debug("[PT] Sharing programme:", input.programmeId, "with client:", input.clientId);

    const { data: ptProfile, error: ptError } = await supabaseAdmin
      .from("pt_profile_view")
      .select("is_pt")
      .eq("id", ctx.userId)
      .single();

    if (ptError || !ptProfile?.is_pt) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only PTs can share programmes",
      });
    }

    const { data: relationship } = await supabaseAdmin
      .from("pt_client_relationships")
      .select("*")
      .eq("pt_id", ctx.userId)
      .eq("client_id", input.clientId)
      .eq("status", "active")
      .single();

    if (!relationship) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Client relationship not found or inactive",
      });
    }

    const { data: programme } = await supabaseAdmin
      .from("programmes")
      .select("*")
      .eq("id", input.programmeId)
      .eq("user_id", ctx.userId)
      .single();

    if (!programme) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Programme not found",
      });
    }

    const { data: existingShare } = await supabaseAdmin
      .from("shared_programmes")
      .select("*")
      .eq("programme_id", input.programmeId)
      .eq("client_id", input.clientId)
      .single();

    if (existingShare) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Programme already shared with this client",
      });
    }

    const { data: sharedProgramme, error: shareError } = await supabaseAdmin
      .from("shared_programmes")
      .insert({
        programme_id: input.programmeId,
        pt_id: ctx.userId,
        client_id: input.clientId,
        shared_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (shareError) {
      logger.error("[PT] Error sharing programme:", shareError);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to share programme",
      });
    }

    logger.debug("[PT] Programme shared successfully:", sharedProgramme.id);
    return { success: true, sharedProgramme };
  });
