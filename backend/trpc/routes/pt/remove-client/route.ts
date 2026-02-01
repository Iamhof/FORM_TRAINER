import { z } from "zod";
import { protectedProcedure } from "../../../create-context.js";
import { supabaseAdmin } from "../../../../lib/auth.js";
import { TRPCError } from "@trpc/server";
import { logger } from '@/lib/logger';

export const removeClientProcedure = protectedProcedure
  .input(
    z.object({
      clientId: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    logger.debug("[PT] Removing client:", input.clientId);

    const { data: ptProfile, error: ptError } = await supabaseAdmin
      .from("pt_profile_view")
      .select("is_pt")
      .eq("id", ctx.userId)
      .single();

    if (ptError || !ptProfile?.is_pt) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only PTs can remove clients",
      });
    }

    const { error } = await supabaseAdmin
      .from("pt_client_relationships")
      .update({ status: "inactive" })
      .eq("pt_id", ctx.userId)
      .eq("client_id", input.clientId);

    if (error) {
      logger.error("[PT] Error removing client:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to remove client",
      });
    }

    logger.debug("[PT] Client removed successfully");
    return { success: true };
  });
