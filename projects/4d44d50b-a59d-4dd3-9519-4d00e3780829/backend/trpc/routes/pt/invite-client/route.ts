import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const inviteClientProcedure = protectedProcedure
  .input(
    z.object({
      client_email: z.string().email(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { data, error } = await supabase
      .from("pt_client_invitations")
      .insert({
        pt_id: ctx.user.id,
        client_email: input.client_email,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("[PT Invite Client] Error:", error);
      throw new Error("Failed to send invitation");
    }

    return data;
  });
