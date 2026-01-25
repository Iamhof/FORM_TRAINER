import { protectedProcedure } from "../../../create-context";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const listProgrammesProcedure = protectedProcedure.query(async ({ ctx }) => {
  const { data, error } = await supabase
    .from("programmes")
    .select("*")
    .eq("user_id", ctx.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Programmes List] Error:", error);
    throw new Error("Failed to fetch programmes");
  }

  return data || [];
});
