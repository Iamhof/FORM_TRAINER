import { protectedProcedure } from "../../../create-context";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const getMyPTProcedure = protectedProcedure.query(async ({ ctx }) => {
  const { data, error } = await supabase
    .from("pt_client_invitations")
    .select("*, pt:profiles!pt_id(*)")
    .eq("client_id", ctx.user.id)
    .eq("status", "accepted")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("[Client Get My PT] Error:", error);
    throw new Error("Failed to fetch PT");
  }

  return data;
});
