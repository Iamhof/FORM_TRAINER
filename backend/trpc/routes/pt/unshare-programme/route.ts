import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { supabaseAdmin } from "../../../../lib/auth";
import { TRPCError } from "@trpc/server";

export const unshareProgrammeProcedure = protectedProcedure
  .input(
    z.object({
      sharedProgrammeId: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    console.log("[PT] Unsharing programme:", input.sharedProgrammeId);

    const { data: ptUser, error: ptError } = await supabaseAdmin
      .from("users")
      .select("is_pt")
      .eq("id", ctx.userId)
      .single();

    if (ptError || !ptUser?.is_pt) {
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
      console.error("[PT] Error unsharing programme:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to unshare programme",
      });
    }

    console.log("[PT] Programme unshared successfully");
    return { success: true };
  });
