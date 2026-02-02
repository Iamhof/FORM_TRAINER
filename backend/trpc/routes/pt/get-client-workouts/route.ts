import { z } from "zod";
import { protectedProcedure } from "../../../create-context.js";
import { supabaseAdmin } from "../../../../lib/auth.js";
import { TRPCError } from "@trpc/server";
import { logger } from "../../../../../lib/logger.js";

export const getClientWorkoutsProcedure = protectedProcedure
  .input(
    z.object({
      clientId: z.string(),
      limit: z.number().optional().default(20),
    })
  )
  .query(async ({ ctx, input }) => {
    logger.debug("[PT] Getting workouts for client:", input.clientId);

    const { data: ptProfile, error: ptError } = await supabaseAdmin
      .from("pt_profile_view")
      .select("is_pt")
      .eq("id", ctx.userId)
      .single();

    if (ptError || !ptProfile?.is_pt) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only PTs can view client workouts",
      });
    }

    const { data: relationship } = await supabaseAdmin
      .from("pt_client_relationships")
      .select("*")
      .eq("pt_id", ctx.userId)
      .eq("client_id", input.clientId)
      .eq("status", "active")
      .single();

    if (!relationship) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Client relationship not found or inactive",
      });
    }

    const { data: workouts, error } = await supabaseAdmin
      .from("workouts")
      .select("*")
      .eq("user_id", input.clientId)
      .order("completed_at", { ascending: false })
      .limit(input.limit);

    if (error) {
      logger.error("[PT] Error fetching client workouts:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch client workouts",
      });
    }

    return workouts;
  });
