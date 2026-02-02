import { z } from "zod";
import { protectedProcedure } from "../../../create-context.js";
import { createClient } from "@supabase/supabase-js";
import { logger } from '../../../../../lib/logger.js';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const listBodyMetricsProcedure = protectedProcedure
  .input(
    z.object({
      limit: z.number().optional().default(12),
    })
  )
  .query(async ({ ctx, input }) => {
    const { data, error } = await supabase
      .from("body_metrics")
      .select("*")
      .eq("user_id", ctx.userId)
      .order("logged_at", { ascending: false })
      .limit(input.limit);

    if (error) {
      logger.error("[Body Metrics List] Error:", error);
      throw new Error("Failed to fetch body metrics");
    }

    return data || [];
  });
