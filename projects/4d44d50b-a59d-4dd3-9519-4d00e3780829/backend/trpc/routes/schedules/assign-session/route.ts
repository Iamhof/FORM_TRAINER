import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const assignSessionProcedure = protectedProcedure
  .input(
    z.object({
      week_index: z.number(),
      day_index: z.number(),
      session: z.any(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { data: schedule } = await supabase
      .from("schedules")
      .select("*")
      .eq("user_id", ctx.user.id)
      .single();

    const scheduleData = schedule?.schedule_data || {};
    const weekKey = `week_${input.week_index}`;
    const dayKey = `day_${input.day_index}`;

    if (!scheduleData[weekKey]) {
      scheduleData[weekKey] = {};
    }

    scheduleData[weekKey][dayKey] = input.session;

    const { data, error } = await supabase
      .from("schedules")
      .upsert(
        {
          user_id: ctx.user.id,
          schedule_data: scheduleData,
        },
        {
          onConflict: "user_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("[Schedule Assign Session] Error:", error);
      throw new Error("Failed to assign session");
    }

    return data;
  });
