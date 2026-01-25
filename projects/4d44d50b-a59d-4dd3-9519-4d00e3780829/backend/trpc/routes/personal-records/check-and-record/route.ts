import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { supabaseAdmin } from "../../../../lib/auth";

export const checkAndRecordPRProcedure = protectedProcedure
  .input(
    z.object({
      exercise_name: z.string(),
      weight: z.number(),
      reps: z.number(),
      volume: z.number(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { data: existingPR } = await supabaseAdmin
      .from("personal_records")
      .select("*")
      .eq("user_id", ctx.user.id)
      .eq("exercise_name", input.exercise_name)
      .single();

    const isNewPR = !existingPR || input.volume > existingPR.volume;

    if (isNewPR) {
      const { data, error } = await supabaseAdmin
        .from("personal_records")
        .upsert(
          {
            user_id: ctx.user.id,
            exercise_name: input.exercise_name,
            weight: input.weight,
            reps: input.reps,
            volume: input.volume,
            achieved_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,exercise_name",
          }
        )
        .select()
        .single();

      if (error) {
        console.error("[Personal Records] Error:", error);
        throw new Error("Failed to record personal record");
      }

      return { isNewPR: true, record: data };
    }

    return { isNewPR: false, record: existingPR };
  });
