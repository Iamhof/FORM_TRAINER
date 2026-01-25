import { protectedProcedure } from "../../../create-context";
import { supabaseAdmin } from "../../../../lib/auth";
import { TRPCError } from "@trpc/server";
import { logger } from "@/lib/logger";

export const listClientsProcedure = protectedProcedure.query(async ({ ctx }) => {
  logger.debug("[PT] Listing clients for PT:", ctx.userId);

  const { data: ptProfile, error: ptError } = await supabaseAdmin
    .from("pt_profile_view")
    .select("is_pt")
    .eq("id", ctx.userId)
    .single();

  if (ptError || !ptProfile?.is_pt) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only PTs can view clients",
    });
  }

  const { data: relationships, error } = await supabaseAdmin
    .from("pt_client_relationships")
    .select("*")
    .eq("pt_id", ctx.userId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("[PT] Error fetching clients:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch clients",
    });
  }

  if (!relationships || relationships.length === 0) {
    return [];
  }

  const clientIds = relationships.map((relationship) => relationship.client_id);

  const { data: clientProfiles, error: profileError } = await supabaseAdmin
    .from("pt_profile_view")
    .select("id, email, name")
    .in("id", clientIds);

  if (profileError) {
    logger.error("[PT] Error fetching client profiles:", profileError);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch client profiles",
    });
  }

  const profileMap = new Map(
    (clientProfiles ?? []).map((profile) => [profile.id, profile])
  );

  const { data: shareRows, error: shareError } = await supabaseAdmin
    .from("shared_programmes")
    .select("id, client_id, programme_id")
    .eq("pt_id", ctx.userId);

  if (shareError) {
    logger.error("[PT] Error fetching shared programme counts:", shareError);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch shared programme counts",
    });
  }

  const sharedProgrammesMap = new Map<
    string,
    { id: string; programmeId: string }[]
  >();

  (shareRows ?? []).forEach((row) => {
    const existing = sharedProgrammesMap.get(row.client_id) ?? [];
    existing.push({ id: row.id, programmeId: row.programme_id });
    sharedProgrammesMap.set(row.client_id, existing);
  });

  return relationships.map((relationship) => {
    const profile = profileMap.get(relationship.client_id);
    const name = profile?.name ?? profile?.email ?? "Unknown client";
    const sharedProgrammeEntries =
      sharedProgrammesMap.get(relationship.client_id) ?? [];

    return {
      id: relationship.client_id,
      relationshipId: relationship.id,
      status: relationship.status,
      connectedAt: relationship.created_at ?? relationship.updated_at ?? null,
      name,
      email: profile?.email ?? "",
      sharedProgrammes: sharedProgrammeEntries.length,
      sharedProgrammeIds: sharedProgrammeEntries,
    };
  });
});
