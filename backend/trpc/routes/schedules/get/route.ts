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

    return data || null;
  });
