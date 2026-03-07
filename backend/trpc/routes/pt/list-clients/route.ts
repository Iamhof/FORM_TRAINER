import { TRPCError } from "@trpc/server";

import { narrowError } from "../../../../../lib/error-utils.js";
import { logger } from "../../../../../lib/logger.js";
import { supabaseAdmin } from "../../../../lib/auth.js";
import { protectedProcedure } from "../../../create-context.js";

export const listClientsProcedure = protectedProcedure.query(async ({ ctx }) => {
  logger.debug("[PT] Listing clients for PT:", ctx.userId);

  try {
    // Single RPC call replaces 4 sequential queries
    const { data, error } = await supabaseAdmin
      .rpc('list_pt_clients_optimized', {
        p_pt_id: ctx.userId
      });

    if (error) {
      // Check for PT verification error
      if (error.message?.includes('user_not_pt')) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only PTs can view clients",
        });
      }

      // Use narrowError for type-safe error handling
      const typed = narrowError(error);
      logger.error("[PT] Error fetching clients:", {
        message: typed.message,
        code: typed.code,
        details: typed.details
      });

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch clients",
      });
    }

    // RPC returns data in exact format needed by frontend
    return data ?? [];

  } catch (error: unknown) {
    if (error instanceof TRPCError) {
      throw error;
    }

    const typed = narrowError(error);
    logger.error("[PT] Unexpected error in listClients:", {
      message: typed.message,
      code: typed.code,
    });

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
    });
  }
});
