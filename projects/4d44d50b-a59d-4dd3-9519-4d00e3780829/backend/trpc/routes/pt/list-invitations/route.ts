import { protectedProcedure } from "../../../create-context";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const listInvitationsProcedure = protectedProcedure.query(async ({ ctx }) => {
  const { data, error } = await supabase
    .from("pt_client_invitations")
    .select("*")
    .or(`pt_id.eq.${ctx.user.id},client_id.eq.${ctx.user.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[PT List Invitations] Error:", error);
    throw new Error("Failed to fetch invitations");
  }

  return data || [];
});
