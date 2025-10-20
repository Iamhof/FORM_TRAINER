import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const deleteBodyMetricProcedure = protectedProcedure
  .input(
    z.object({
      id: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { error } = await supabase
      .from("body_metrics")
      .delete()
      .eq("id", input.id)
      .eq("user_id", ctx.user.id);

    if (error) {
      console.error("[Body Metrics Delete] Error:", error);
      throw new Error("Failed to delete body metric");
    }

    return { success: true };
  });
