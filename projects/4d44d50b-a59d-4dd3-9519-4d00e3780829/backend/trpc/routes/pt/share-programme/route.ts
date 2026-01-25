import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const shareProgrammeProcedure = protectedProcedure
  .input(
    z.object({
      programme_id: z.string(),
      client_id: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { data, error } = await supabase
      .from("shared_programmes")
      .insert({
        programme_id: input.programme_id,
        pt_id: ctx.user.id,
        client_id: input.client_id,
      })
      .select()
      .single();

    if (error) {
      console.error("[PT Share Programme] Error:", error);
      throw new Error("Failed to share programme");
    }

    return data;
  });
