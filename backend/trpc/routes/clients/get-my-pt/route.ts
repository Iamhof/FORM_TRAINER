import { protectedProcedure } from "../../../create-context.js";
import { supabaseAdmin } from "../../../../lib/auth.js";
import { TRPCError } from "@trpc/server";
import { logger } from "../../../../../lib/logger.js";

export const getMyPTProcedure = protectedProcedure.query(async ({ ctx }) => {
  logger.debug("[Client] Getting PT for client:", ctx.userId);

  const { data: relationship, error } = await supabaseAdmin
    .from("pt_client_relationships")
    .select("*")
    .eq("client_id", ctx.userId)
    .eq("status", "active")
    .single();

  if (error) {
    if ((error as any)?.code === "PGRST116") {
      return null;
    }

    logger.error("[Client] Error fetching PT relationship:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch PT",
    });
  }

  if (!relationship) {
    return null;
  }

  const { data: ptProfile, error: profileError } = await supabaseAdmin
    .from("pt_profile_view")
    .select("id, email, name, is_pt")
    .eq("id", relationship.pt_id)
    .single();

  if (profileError || !ptProfile) {
    logger.error("[Client] Error fetching PT profile:", profileError);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch PT profile",
    });
  }

  return {
    id: ptProfile.id,
    name: ptProfile.name ?? ptProfile.email ?? "Personal Trainer",
    email: ptProfile.email ?? "",
    isPt: ptProfile.is_pt,
    connectedAt: relationship.created_at ?? relationship.updated_at ?? null,
  };
});
