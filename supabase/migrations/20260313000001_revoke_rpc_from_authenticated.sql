-- Migration: Revoke EXECUTE on SECURITY DEFINER RPCs from authenticated role
-- Why: These RPCs bypass RLS. Any authenticated user can call them directly via
-- Supabase REST /rpc/ endpoint to award XP to anyone, log workouts as anyone,
-- share programmes without authorization, or list any PT's clients.
-- All access already goes through tRPC's supabaseAdmin (service_role).

-- award_xp_transaction (20260210_add_xp_leveling_system.sql:180)
REVOKE EXECUTE ON FUNCTION public.award_xp_transaction(UUID, TEXT, INTEGER, TEXT, JSONB) FROM authenticated;

-- log_workout_transaction (20251110_data_rpcs.sql:476)
REVOKE EXECUTE ON FUNCTION public.log_workout_transaction(uuid, uuid, text, integer, integer, jsonb, timestamptz) FROM authenticated;

-- share_programme_atomic (20260215_security_fixes.sql:86)
REVOKE EXECUTE ON FUNCTION public.share_programme_atomic(uuid, uuid, uuid) FROM authenticated;

-- list_pt_clients_optimized (20260216_pt_client_list_rpc.sql:66)
REVOKE EXECUTE ON FUNCTION public.list_pt_clients_optimized(UUID) FROM authenticated;

-- get_volume (20251110_data_rpcs.sql:477) — also SECURITY DEFINER, will be
-- refactored in migration 20260313000004 to accept p_user_id
REVOKE EXECUTE ON FUNCTION public.get_volume(text) FROM authenticated;

-- get_strength_trend (20251110_data_rpcs.sql:478) — same issue as get_volume
REVOKE EXECUTE ON FUNCTION public.get_strength_trend(integer) FROM authenticated;
