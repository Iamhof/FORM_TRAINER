import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const workoutHistoryProcedure = protectedProcedure
  .input(
    z.object({
      limit: z.number().optional().default(50),
    })
  )
  .query(async ({ ctx, input }) => {
    const { data, error } = await supabase
      .from("workouts")
      .select("*")
      .eq("user_id", ctx.user.id)
      .order("completed_at", { ascending: false })
      .limit(input.limit);

    if (error) {
      console.error("[Workout History] Error:", error);
      throw new Error("Failed to fetch workout history");
    }

    return data || [];
  });
