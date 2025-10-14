import { protectedProcedure } from "../../../create-context";
import { supabaseAdmin } from "../../../../lib/auth";
import { TRPCError } from "@trpc/server";

export const listSharedProgrammesProcedure = protectedProcedure.query(
  async ({ ctx }) => {
    console.log("[Client] Listing shared programmes for client:", ctx.userId);

    const { data: sharedProgrammes, error } = await supabaseAdmin
      .from("shared_programmes")
      .select(`
        *,
        programme:programmes!shared_programmes_programme_id_fkey(*),
        pt:users!shared_programmes_pt_id_fkey(id, name, email)
      `)
      .eq("client_id", ctx.userId)
      .order("shared_at", { ascending: false });

    if (error) {
      console.error("[Client] Error fetching shared programmes:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch shared programmes",
      });
    }

    return sharedProgrammes;
  }
);
