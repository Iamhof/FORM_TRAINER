import { protectedProcedure } from "../../../create-context.js";
import { supabaseAdmin } from '../../../../lib/auth.js';
import { logger } from '../../../../../lib/logger.js';

export const getLatestBodyMetricsProcedure = protectedProcedure.query(async ({ ctx }) => {
  const { data, error } = await supabaseAdmin
    .from("body_metrics")
    .select("*")
    .eq("user_id", ctx.userId)
    .order("logged_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    logger.error("[Body Metrics Latest] Error:", error);
    throw new Error("Failed to fetch latest body metric");
  }

  return data;
});
