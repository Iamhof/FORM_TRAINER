import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { supabaseAdmin } from "../../../../lib/auth";
import { TRPCError } from "@trpc/server";

export const getClientAnalyticsProcedure = protectedProcedure
  .input(
    z.object({
      clientId: z.string(),
      exerciseId: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  )
  .query(async ({ ctx, input }) => {
    console.log("[PT] Getting analytics for client:", input.clientId);

    const { data: ptUser, error: ptError } = await supabaseAdmin
      .from("users")
      .select("is_pt")
      .eq("id", ctx.userId)
      .single();

    if (ptError || !ptUser?.is_pt) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only PTs can view client analytics",
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

    let query = supabaseAdmin
      .from("analytics")
      .select("*")
      .eq("user_id", input.clientId);

    if (input.exerciseId) {
      query = query.eq("exercise_id", input.exerciseId);
    }

    if (input.startDate) {
      query = query.gte("date", input.startDate);
    }

    if (input.endDate) {
      query = query.lte("date", input.endDate);
    }

    query = query.order("date", { ascending: true });

    const { data: analytics, error } = await query;

    if (error) {
      console.error("[PT] Error fetching client analytics:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch client analytics",
      });
    }

    return analytics;
  });
