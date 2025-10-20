import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const updateColorProcedure = protectedProcedure
  .input(
    z.object({
      accent_color: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        accent_color: input.accent_color,
      })
      .eq("id", ctx.user.id)
      .select()
      .single();

    if (error) {
      console.error("[Profile Update Color] Error:", error);
      throw new Error("Failed to update profile color");
    }

    return data;
  });
