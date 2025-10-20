import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const syncAnalyticsProcedure = protectedProcedure
  .input(
    z.object({
      total_workouts: z.number(),
      total_volume: z.number(),
      total_exercises: z.number(),
      current_streak: z.number(),
      best_streak: z.number(),
      workouts_this_week: z.number(),
      workouts_this_month: z.number(),
      volume_by_week: z.array(z.number()),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { data, error } = await supabase
      .from("analytics")
      .upsert(
        {
          user_id: ctx.user.id,
          ...input,
          last_updated: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("[Analytics Sync] Error:", error);
      throw new Error("Failed to sync analytics");
    }

    return data;
  });
