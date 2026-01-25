import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const removeClientProcedure = protectedProcedure
  .input(
    z.object({
      client_id: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { error } = await supabase
      .from("pt_client_invitations")
      .delete()
      .eq("pt_id", ctx.user.id)
      .eq("client_id", input.client_id);

    if (error) {
      console.error("[PT Remove Client] Error:", error);
      throw new Error("Failed to remove client");
    }

    return { success: true };
  });
