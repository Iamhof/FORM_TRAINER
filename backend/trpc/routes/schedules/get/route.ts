import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { supabaseAdmin } from "../../../../lib/auth";

export const getScheduleProcedure = protectedProcedure
  .input(
    z.object({
      weekStart: z.string(),
    })
  )
  .query(async ({ ctx, input }) => {
    const { data, error } = await supabaseAdmin
      .from("schedules")
      .select("*")
      .eq("user_id", ctx.userId)
      .eq("week_start", input.weekStart)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to fetch schedule: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    let schedulePayload: any;

    if (Array.isArray(data.schedule)) {
      schedulePayload = data.schedule;
    } else if (data.schedule !== null && data.schedule !== undefined && data.schedule.constructor === String) {
      try {
        schedulePayload = JSON.parse(data.schedule);
      } catch {
        schedulePayload = null;
      }
    } else if (data.schedule && data.schedule !== null && data.schedule.constructor === Object) {
      const candidate = data.schedule as { length?: number };
      schedulePayload = candidate.length !== undefined && Number.isFinite(candidate.length) && candidate.length >= 0 
        ? Array.from(candidate as ArrayLike<unknown>) 
        : null;
    }

    return {
      ...data,
      schedule: Array.isArray(schedulePayload) ? schedulePayload : [],
    };
  });
