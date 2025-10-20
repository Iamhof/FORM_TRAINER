import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const getClientWorkoutsProcedure = protectedProcedure
  .input(
    z.object({
      client_id: z.string(),
      limit: z.number().optional().default(20),
    })
  )
  .query(async ({ ctx, input }) => {
    const { data: relationship } = await supabase
      .from("pt_client_invitations")
      .select("*")
      .eq("pt_id", ctx.user.id)
      .eq("client_id", input.client_id)
      .eq("status", "accepted")
      .single();

    if (!relationship) {
      throw new Error("Not authorized");
    }

    const { data, error } = await supabase
      .from("workouts")
      .select("*")
      .eq("user_id", input.client_id)
      .order("completed_at", { ascending: false })
      .limit(input.limit);

    if (error) {
      console.error("[PT Get Client Workouts] Error:", error);
      throw new Error("Failed to fetch client workouts");
    }

    return data || [];
  });
