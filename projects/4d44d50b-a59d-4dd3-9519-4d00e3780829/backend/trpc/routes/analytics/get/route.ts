import { protectedProcedure } from "../../../create-context";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const getAnalyticsProcedure = protectedProcedure.query(async ({ ctx }) => {
  const { data, error } = await supabase
    .from("analytics")
    .select("*")
    .eq("user_id", ctx.user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("[Analytics Get] Error:", error);
    throw new Error("Failed to fetch analytics");
  }

  return data;
});
