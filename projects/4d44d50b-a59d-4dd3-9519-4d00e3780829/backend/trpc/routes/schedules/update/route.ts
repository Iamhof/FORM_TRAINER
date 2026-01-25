import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const updateScheduleProcedure = protectedProcedure
  .input(
    z.object({
      schedule_data: z.any(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { data, error } = await supabase
      .from("schedules")
      .upsert(
        {
          user_id: ctx.user.id,
          schedule_data: input.schedule_data,
        },
        {
          onConflict: "user_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("[Schedule Update] Error:", error);
      throw new Error("Failed to update schedule");
    }

    return data;
  });
