import { protectedProcedure } from "../../../create-context";
import { supabaseAdmin } from "../../../../lib/auth";
import { TRPCError } from "@trpc/server";

export const listInvitationsProcedure = protectedProcedure.query(
  async ({ ctx }) => {
    console.log("[PT] Listing invitations for PT:", ctx.userId);

    const { data: ptUser, error: ptError } = await supabaseAdmin
      .from("users")
      .select("is_pt")
      .eq("id", ctx.userId)
      .single();

    if (ptError || !ptUser?.is_pt) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only PTs can view invitations",
      });
    }

    const { data: invitations, error } = await supabaseAdmin
      .from("pt_invitations")
      .select("*")
      .eq("pt_id", ctx.userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[PT] Error fetching invitations:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch invitations",
      });
    }

    return invitations;
  }
);
