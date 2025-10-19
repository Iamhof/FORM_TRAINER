import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { supabaseAdmin } from "../../../../lib/auth";

const scheduleDaySchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  status: z.enum(["scheduled", "completed", "rest", "empty"]),
  sessionId: z.string().optional().nullable(),
  weekStart: z.string(),
});

export const updateScheduleProcedure = protectedProcedure
  .input(
    z.object({
      weekStart: z.string(),
      programmeId: z.string().nullable(),
      schedule: z.array(scheduleDaySchema),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { data: existing } = await supabaseAdmin
      .from("schedules")
      .select("id")
      .eq("user_id", ctx.userId)
      .eq("week_start", input.weekStart)
      .maybeSingle();

    if (existing) {
      const { error } = await supabaseAdmin
        .from("schedules")
        .update({
          schedule: input.schedule,
          programme_id: input.programmeId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) {
        throw new Error(`Failed to update schedule: ${error.message}`);
      }
    } else {
      const { error } = await supabaseAdmin.from("schedules").insert({
        user_id: ctx.userId,
        programme_id: input.programmeId,
        week_start: input.weekStart,
        schedule: input.schedule,
      });

      if (error) {
        throw new Error(`Failed to create schedule: ${error.message}`);
      }
    }

    return { success: true };
  });
