import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { supabaseAdmin } from "../../../../lib/auth";
import { TRPCError } from "@trpc/server";
import { logger } from '@/lib/logger';

export const unshareProgrammeProcedure = protectedProcedure
  .input(
    z.object({
      sharedProgrammeId: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    logger.debug("[PT] Unsharing programme:", input.sharedProgrammeId);

    const { data: ptProfile, error: ptError } = await supabaseAdmin
      .from("pt_profile_view")
      .select("is_pt")
      .eq("id", ctx.userId)
      .single();

    if (ptError || !ptProfile?.is_pt) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only PTs can unshare programmes",
      });
    }

    const { error } = await supabaseAdmin
      .from("shared_programmes")
      .delete()
      .eq("id", input.sharedProgrammeId)
      .eq("pt_id", ctx.userId);

    if (error) {
      logger.error("[PT] Error unsharing programme:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to unshare programme",
      });
    }

    logger.debug("[PT] Programme unshared successfully");
    return { success: true };
  });
