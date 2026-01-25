import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const deleteProgrammeProcedure = protectedProcedure
  .input(
    z.object({
      id: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { error } = await supabase
      .from("programmes")
      .delete()
      .eq("id", input.id)
      .eq("user_id", ctx.user.id);

    if (error) {
      console.error("[Programme Delete] Error:", error);
      throw new Error("Failed to delete programme");
    }

    return { success: true };
  });
