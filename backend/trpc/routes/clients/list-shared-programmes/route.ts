import { protectedProcedure } from "../../../create-context";
import { supabaseAdmin } from "../../../../lib/auth";
import { TRPCError } from "@trpc/server";
import { logger } from "@/lib/logger";

export const listSharedProgrammesProcedure = protectedProcedure.query(
  async ({ ctx }) => {
    logger.debug("[Client] Listing shared programmes for client:", ctx.userId);

    const { data: sharedProgrammes, error } = await supabaseAdmin
      .from("shared_programmes")
      .select(
        `
        id,
        programme_id,
        pt_id,
        client_id,
        shared_at,
        programme:programmes!shared_programmes_programme_id_fkey(id, name, days, weeks)
      `
      )
      .eq("client_id", ctx.userId)
      .order("shared_at", { ascending: false });

    if (error) {
      logger.error("[Client] Error fetching shared programmes:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch shared programmes",
      });
    }

    if (!sharedProgrammes || sharedProgrammes.length === 0) {
      return [];
    }

    const ptIds = Array.from(new Set(sharedProgrammes.map((item) => item.pt_id)));
    const programmeIds = Array.from(
      new Set(sharedProgrammes.map((item) => item.programme_id))
    );

    const { data: ptProfiles, error: profileError } = await supabaseAdmin
      .from("pt_profile_view")
      .select("id, name, email")
      .in("id", ptIds);

    if (profileError) {
      logger.error("[Client] Error fetching PT profiles:", profileError);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch shared programme metadata",
      });
    }

    const ptMap = new Map(
      (ptProfiles ?? []).map((profile) => [profile.id, profile])
    );

    let programmeRows: Array<Record<string, any>> = [];

    if (programmeIds.length > 0) {
      const { data, error: programmeError } = await supabaseAdmin
        .from("programmes")
        .select("id, name, days, weeks")
        .in("id", programmeIds);

      if (programmeError) {
        logger.error("[Client] Error fetching programme metadata:", programmeError);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch programme metadata",
        });
      }

      programmeRows = data ?? [];
    }

    const programmeMap = new Map(
      (programmeRows ?? []).map((programme) => [programme.id, programme])
    );

    return sharedProgrammes.map((programme) => {
      const ptProfile = ptMap.get(programme.pt_id);
      const programmeMeta = programmeMap.get(programme.programme_id) ?? null;

      return {
        id: programme.id,
        programmeId: programme.programme_id,
        programmeName: programmeMeta?.name ?? "Untitled Programme",
        days: programmeMeta?.days ?? 0,
        weeks: programmeMeta?.weeks ?? 0,
        sharedAt: programme.shared_at,
        ptId: programme.pt_id,
        ptName: ptProfile?.name ?? ptProfile?.email ?? "Personal Trainer",
      };
    });
  }
);
