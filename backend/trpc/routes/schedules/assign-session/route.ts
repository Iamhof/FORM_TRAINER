import { z } from "zod";
import { protectedProcedure } from "../../../create-context.js";
import { supabaseAdmin } from "../../../../lib/auth.js";

export const assignSessionProcedure = protectedProcedure
  .input(
    z.object({
      weekStart: z.string(),
      programmeId: z.string(),
      dayOfWeek: z.number().min(0).max(6),
      sessionId: z.string().nullable(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { data: existing } = await supabaseAdmin
      .from("schedules")
      .select("*")
      .eq("user_id", ctx.userId)
      .eq("week_start", input.weekStart)
      .maybeSingle();

    let schedule: any[];

    if (existing) {
      schedule = Array.isArray(existing.schedule)
        ? existing.schedule
        : JSON.parse(existing.schedule as string);
    } else {
      schedule = Array.from({ length: 7 }, (_, i) => ({
        dayOfWeek: i,
        status: "empty",
        sessionId: null,
        weekStart: input.weekStart,
      }));
    }

    const dayIndex = input.dayOfWeek;
    if (schedule[dayIndex]) {
      schedule[dayIndex] = {
        ...schedule[dayIndex],
        sessionId: input.sessionId,
        status: input.sessionId ? "scheduled" : "rest",
      };
    }

    if (existing) {
      const { error } = await supabaseAdmin
        .from("schedules")
        .update({
          schedule,
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
        schedule,
      });

      if (error) {
        throw new Error(`Failed to create schedule: ${error.message}`);
      }
    }

    return { success: true, schedule };
  });
