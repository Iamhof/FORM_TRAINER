-- Security Vulnerability Remediation Migration
-- Date: 2026-02-15
-- Purpose: Fix HIGH/CRITICAL security vulnerabilities identified in audit
--
-- Changes:
--   1. Add CHECK constraint for display_name (XSS prevention)
--   2. Sanitize existing invalid display names
--   3. Create atomic RPC for share_programme (race condition prevention)

-- ===========================================================================
-- VULNERABILITY #1: XSS Protection - Display Name Validation
-- ===========================================================================

-- Add CHECK constraint to enforce character whitelist
ALTER TABLE public.leaderboard_profiles
ADD CONSTRAINT display_name_format_check
CHECK (display_name ~ '^[a-zA-Z0-9\s\-_.'']+$');

-- Sanitize existing invalid display names
-- Strip any characters that don't match the whitelist
UPDATE public.leaderboard_profiles
SET display_name = regexp_replace(display_name, '[^a-zA-Z0-9\s\-_.'']+', '', 'g')
WHERE display_name !~ '^[a-zA-Z0-9\s\-_.'']+$';

-- ===========================================================================
-- VULNERABILITY #4: Race Condition Prevention - Atomic Share Programme
-- ===========================================================================

-- Create atomic function to prevent race conditions when sharing programmes
-- Uses advisory locks to ensure only one share per programme+client combo
CREATE OR REPLACE FUNCTION public.share_programme_atomic(
  p_pt_id uuid,
  p_programme_id uuid,
  p_client_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shared_programme shared_programmes%ROWTYPE;
  v_existing_count integer;
BEGIN
  -- Acquire advisory lock based on programme_id and client_id hash
  -- This prevents concurrent share attempts for the same programme+client combo
  -- Lock is automatically released at transaction end (commit/rollback)
  PERFORM pg_advisory_xact_lock(
    hashtext(p_programme_id::text || p_client_id::text)
  );

  -- Check if already shared (within the lock for atomicity)
  SELECT COUNT(*) INTO v_existing_count
  FROM shared_programmes
  WHERE programme_id = p_programme_id
    AND client_id = p_client_id;

  IF v_existing_count > 0 THEN
    RAISE EXCEPTION 'Programme already shared with this client'
      USING ERRCODE = 'unique_violation';
  END IF;

  -- Insert share record atomically
  INSERT INTO shared_programmes (
    programme_id,
    pt_id,
    client_id,
    shared_at,
    created_at
  )
  VALUES (
    p_programme_id,
    p_pt_id,
    p_client_id,
    timezone('utc', now()),
    timezone('utc', now())
  )
  RETURNING * INTO v_shared_programme;

  -- Return the created record as JSON
  RETURN to_jsonb(v_shared_programme);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.share_programme_atomic(uuid, uuid, uuid) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.share_programme_atomic IS
  'Atomically shares a programme with a client. Uses advisory locks to prevent race conditions. ' ||
  'Returns the created shared_programme record or raises an exception if already shared.';

-- ===========================================================================
-- VERIFICATION QUERIES
-- ===========================================================================

-- Verify display_name constraint exists
-- Run: SELECT conname, contype, pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'display_name_format_check';

-- Verify all display names are valid
-- Run: SELECT COUNT(*) FROM leaderboard_profiles WHERE display_name !~ '^[a-zA-Z0-9\s\-_.'']+$';
-- Expected: 0

-- Verify RPC function exists
-- Run: SELECT routine_name, routine_type FROM information_schema.routines WHERE routine_name = 'share_programme_atomic';

-- Test RPC function (replace UUIDs with real values)
-- Run: SELECT share_programme_atomic('pt_uuid'::uuid, 'programme_uuid'::uuid, 'client_uuid'::uuid);
