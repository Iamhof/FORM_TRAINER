import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const acceptInvitationProcedure = protectedProcedure
  .input(
    z.object({
      invitation_id: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { data, error } = await supabase
      .from("pt_client_invitations")
      .update({
        status: "accepted",
        client_id: ctx.user.id,
      })
      .eq("id", input.invitation_id)
      .select()
      .single();

    if (error) {
      console.error("[PT Accept Invitation] Error:", error);
      throw new Error("Failed to accept invitation");
    }

    return data;
  });
