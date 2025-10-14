import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { supabaseAdmin } from "../../../../lib/auth";
import { TRPCError } from "@trpc/server";

export const removeClientProcedure = protectedProcedure
  .input(
    z.object({
      clientId: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    console.log("[PT] Removing client:", input.clientId);

    const { data: ptUser, error: ptError } = await supabaseAdmin
      .from("users")
      .select("is_pt")
      .eq("id", ctx.userId)
      .single();

    if (ptError || !ptUser?.is_pt) {
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
      console.error("[PT] Error removing client:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to remove client",
      });
    }

    console.log("[PT] Client removed successfully");
    return { success: true };
  });
