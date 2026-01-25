import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const createProgrammeProcedure = protectedProcedure
  .input(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      duration_weeks: z.number(),
      days_per_week: z.number(),
      sessions: z.array(z.any()),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { data, error } = await supabase
      .from("programmes")
      .insert({
        user_id: ctx.user.id,
        name: input.name,
        description: input.description,
        duration_weeks: input.duration_weeks,
        days_per_week: input.days_per_week,
        sessions: input.sessions,
      })
      .select()
      .single();

    if (error) {
      console.error("[Programme Create] Error:", error);
      throw new Error("Failed to create programme");
    }

    return data;
  });
