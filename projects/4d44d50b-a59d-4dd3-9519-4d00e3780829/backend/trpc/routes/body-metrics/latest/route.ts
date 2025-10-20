import { protectedProcedure } from "../../../create-context";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const latestBodyMetricProcedure = protectedProcedure.query(async ({ ctx }) => {
  const { data, error } = await supabase
    .from("body_metrics")
    .select("*")
    .eq("user_id", ctx.user.id)
    .order("logged_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("[Body Metrics Latest] Error:", error);
    throw new Error("Failed to fetch latest body metric");
  }

  return data;
});
