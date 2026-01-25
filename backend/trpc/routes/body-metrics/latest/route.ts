import { protectedProcedure } from "../../../create-context";
import { createClient } from "@supabase/supabase-js";
import { logger } from '@/lib/logger';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const getLatestBodyMetricsProcedure = protectedProcedure.query(async ({ ctx }) => {
  const { data, error } = await supabase
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
