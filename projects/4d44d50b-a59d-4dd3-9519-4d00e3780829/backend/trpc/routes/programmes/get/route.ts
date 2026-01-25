import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const getProgrammeProcedure = protectedProcedure
  .input(
    z.object({
      id: z.string(),
    })
  )
  .query(async ({ ctx, input }) => {
    const { data, error } = await supabase
      .from("programmes")
      .select("*")
      .eq("id", input.id)
      .eq("user_id", ctx.user.id)
      .single();

    if (error) {
      console.error("[Programme Get] Error:", error);
      throw new Error("Programme not found");
    }

    return data;
  });
