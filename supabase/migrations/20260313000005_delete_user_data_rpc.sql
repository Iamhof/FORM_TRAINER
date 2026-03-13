-- Migration: Create RPC to cascade-delete all user data
-- Why: Apple Guideline 5.1.1(v) requires account deletion capability.
-- This RPC deletes all user-owned data before the auth user is removed.

CREATE OR REPLACE FUNCTION public.delete_user_data(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete in dependency order (children before parents)
  DELETE FROM public.shared_programmes WHERE programme_id IN (
    SELECT id FROM public.programmes WHERE user_id = p_user_id
  );
  DELETE FROM public.client_progress_sharing WHERE client_id = p_user_id;
  DELETE FROM public.pt_invitations WHERE pt_id = p_user_id OR client_email IN (
    SELECT email FROM auth.users WHERE id = p_user_id
  );
  DELETE FROM public.pt_client_relationships WHERE pt_id = p_user_id OR client_id = p_user_id;
  DELETE FROM public.leaderboard_stats WHERE user_id = p_user_id;
  DELETE FROM public.leaderboard_profiles WHERE user_id = p_user_id;
  DELETE FROM public.analytics WHERE user_id = p_user_id;
  DELETE FROM public.workouts WHERE user_id = p_user_id;
  DELETE FROM public.schedules WHERE user_id = p_user_id;
  DELETE FROM public.programmes WHERE user_id = p_user_id;
  DELETE FROM public.user_roles WHERE user_id = p_user_id;
  DELETE FROM public.profiles WHERE user_id = p_user_id;

  -- Delete from xp_log if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'xp_log') THEN
    EXECUTE 'DELETE FROM public.xp_log WHERE user_id = $1' USING p_user_id;
  END IF;

  -- Delete from body_metrics if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'body_metrics') THEN
    EXECUTE 'DELETE FROM public.body_metrics WHERE user_id = $1' USING p_user_id;
  END IF;

  -- Delete from personal_records if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'personal_records') THEN
    EXECUTE 'DELETE FROM public.personal_records WHERE user_id = $1' USING p_user_id;
  END IF;
END;
$$;

-- Only service_role can call this (via tRPC backend)
GRANT EXECUTE ON FUNCTION public.delete_user_data(UUID) TO service_role;
