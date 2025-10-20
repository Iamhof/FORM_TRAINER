import { protectedProcedure } from "../../../create-context";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const listClientsProcedure = protectedProcedure.query(async ({ ctx }) => {
  const { data, error } = await supabase
    .from("pt_client_invitations")
    .select("*, client:profiles!client_id(*)")
    .eq("pt_id", ctx.user.id)
    .eq("status", "accepted");

  if (error) {
    console.error("[PT List Clients] Error:", error);
    throw new Error("Failed to fetch clients");
  }

  return data || [];
});
