import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const logWorkoutProcedure = protectedProcedure
  .input(
    z.object({
      programme_id: z.string().optional(),
      session_name: z.string(),
      exercises: z.array(z.any()),
      duration_minutes: z.number().optional(),
      notes: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { data, error } = await supabase
      .from("workouts")
      .insert({
        user_id: ctx.user.id,
        programme_id: input.programme_id,
        session_name: input.session_name,
        exercises: input.exercises,
        duration_minutes: input.duration_minutes,
        notes: input.notes,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[Workout Log] Error:", error);
      throw new Error("Failed to log workout");
    }

    return data;
  });
