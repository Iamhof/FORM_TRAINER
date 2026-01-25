import { protectedProcedure } from "../../../create-context";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const listSharedProgrammesProcedure = protectedProcedure.query(async ({ ctx }) => {
  const { data, error } = await supabase
    .from("shared_programmes")
    .select("*, programme:programmes(*)")
    .eq("client_id", ctx.user.id);

  if (error) {
    console.error("[Client List Shared Programmes] Error:", error);
    throw new Error("Failed to fetch shared programmes");
  }

  return data || [];
});
