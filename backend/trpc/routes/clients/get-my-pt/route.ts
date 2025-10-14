import { protectedProcedure } from "../../../create-context";
import { supabaseAdmin } from "../../../../lib/auth";
import { TRPCError } from "@trpc/server";

export const getMyPTProcedure = protectedProcedure.query(async ({ ctx }) => {
  console.log("[Client] Getting PT for client:", ctx.userId);

  const { data: relationship, error } = await supabaseAdmin
    .from("pt_client_relationships")
    .select(`
      *,
      pt:users!pt_client_relationships_pt_id_fkey(id, name, email)
    `)
    .eq("client_id", ctx.userId)
    .eq("status", "active")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("[Client] Error fetching PT:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch PT",
    });
  }

  return relationship;
});
