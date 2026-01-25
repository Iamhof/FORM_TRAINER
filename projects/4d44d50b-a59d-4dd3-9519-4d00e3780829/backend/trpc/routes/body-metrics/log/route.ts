import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const logBodyMetricProcedure = protectedProcedure
  .input(
    z.object({
      weight: z.number().optional(),
      body_fat_percentage: z.number().optional(),
      muscle_mass: z.number().optional(),
      notes: z.string().optional(),
      logged_at: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { data, error } = await supabase
      .from("body_metrics")
      .insert({
        user_id: ctx.user.id,
        weight: input.weight,
        body_fat_percentage: input.body_fat_percentage,
        muscle_mass: input.muscle_mass,
        notes: input.notes,
        logged_at: input.logged_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[Body Metrics Log] Error:", error);
      throw new Error("Failed to log body metric");
    }

    return data;
  });
