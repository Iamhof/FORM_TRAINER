import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { supabaseAdmin } from "../../../../lib/auth";

export const listPersonalRecordsProcedure = protectedProcedure
  .input(z.object({}).optional())
  .query(async ({ ctx }) => {
    const { data, error } = await supabaseAdmin
      .from("personal_records")
      .select("*")
      .eq("user_id", ctx.user.id)
      .order("achieved_at", { ascending: false });

    if (error) {
      console.error("[Personal Records List] Error:", error);
      throw new Error("Failed to fetch personal records");
    }

    return data || [];
  });
