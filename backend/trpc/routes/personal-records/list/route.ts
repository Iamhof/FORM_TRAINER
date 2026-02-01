import { z } from "zod";
import { protectedProcedure } from "../../../create-context.js";
import { createClient } from "@supabase/supabase-js";
import { logger } from '@/lib/logger';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const listPersonalRecordsProcedure = protectedProcedure
  .input(z.object({}).optional())
  .query(async ({ ctx }) => {
    const { data, error } = await supabase
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
