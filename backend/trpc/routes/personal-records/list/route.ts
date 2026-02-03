import { z } from "zod";
import { protectedProcedure } from "../../../create-context.js";
import { supabaseAdmin } from '../../../../lib/auth.js';
import { logger } from '../../../../../lib/logger.js';

export const listPersonalRecordsProcedure = protectedProcedure
  .input(z.object({}).optional())
  .query(async ({ ctx }) => {
    const { data, error } = await supabaseAdmin
      .from("personal_records")
      .select("*")
      .eq("user_id", ctx.userId)
      .order("achieved_at", { ascending: false });

    if (error) {
      logger.error("[Personal Records List] Error:", error);
      throw new Error("Failed to fetch personal records");
    }

    return data || [];
  });
