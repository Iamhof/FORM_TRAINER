import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { supabaseAdmin } from "../../../../lib/auth";
import { TRPCError } from "@trpc/server";

export const getClientWorkoutsProcedure = protectedProcedure
  .input(
    z.object({
      clientId: z.string(),
      limit: z.number().optional().default(20),
    })
  )
  .query(async ({ ctx, input }) => {
    console.log("[PT] Getting workouts for client:", input.clientId);

    const { data: ptUser, error: ptError } = await supabaseAdmin
      .from("users")
      .select("is_pt")
      .eq("id", ctx.userId)
      .single();

    if (ptError || !ptUser?.is_pt) {
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
      console.error("[PT] Error fetching client workouts:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch client workouts",
      });
    }

    return workouts;
  });
