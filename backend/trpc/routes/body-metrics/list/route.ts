import { z } from "zod";
import { protectedProcedure } from "../../../create-context.js";
import { supabaseAdmin } from '../../../../lib/auth.js';
import { logger } from '../../../../../lib/logger.js';

export const listBodyMetricsProcedure = protectedProcedure
  .input(
    z.object({
      limit: z.number().optional().default(12),
    })
  )
  .query(async ({ ctx, input }) => {
    const { data, error } = await supabaseAdmin
      .from("body_metrics")
      .select("*")
      .eq("user_id", ctx.userId)
      .order("date", { ascending: false })
      .limit(input.limit);

    if (error) {
      logger.error("[Body Metrics List] Error:", error);
      throw new Error("Failed to fetch body metrics");
    }

    return data || [];
  });
