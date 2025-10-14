import { protectedProcedure } from "../../../create-context";
import { supabaseAdmin } from "../../../../lib/auth";
import { TRPCError } from "@trpc/server";

export const listClientsProcedure = protectedProcedure.query(async ({ ctx }) => {
  console.log("[PT] Listing clients for PT:", ctx.userId);

  const { data: ptUser, error: ptError } = await supabaseAdmin
    .from("users")
    .select("is_pt")
    .eq("id", ctx.userId)
    .single();

  if (ptError || !ptUser?.is_pt) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only PTs can view clients",
    });
  }

  const { data: relationships, error } = await supabaseAdmin
    .from("pt_client_relationships")
    .select(`
      *,
      client:users!pt_client_relationships_client_id_fkey(id, name, email, created_at)
    `)
    .eq("pt_id", ctx.userId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[PT] Error fetching clients:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch clients",
    });
  }

  return relationships;
});
