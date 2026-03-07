-- =====================================================
-- PT CLIENT LIST OPTIMIZATION RPC
-- Issue #15: Replace 4 sequential queries with single RPC
-- Expected: 570ms → <50ms (>91% improvement)
-- =====================================================

SET check_function_bodies = off;

DROP FUNCTION IF EXISTS public.list_pt_clients_optimized(uuid);

CREATE OR REPLACE FUNCTION public.list_pt_clients_optimized(
  p_pt_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_pt BOOLEAN;
  v_result JSONB;
BEGIN
  -- Inline PT verification
  SELECT is_pt INTO v_is_pt
  FROM profiles
  WHERE user_id = p_pt_id;

  IF NOT FOUND OR v_is_pt IS NOT TRUE THEN
    RAISE EXCEPTION 'user_not_pt' USING HINT = 'Only PTs can view clients';
  END IF;

  -- Single aggregated query
  SELECT JSONB_AGG(
    JSONB_BUILD_OBJECT(
      'id', pcr.client_id,
      'relationshipId', pcr.id,
      'status', pcr.status,
      'connectedAt', COALESCE(pcr.created_at, pcr.updated_at),
      'name', COALESCE(p.name, u.email, 'Unknown client'),
      'email', u.email,
      'sharedProgrammes', COALESCE(sp_counts.count, 0),
      'sharedProgrammeIds', COALESCE(sp_counts.programmes, '[]'::jsonb)
    )
    ORDER BY pcr.created_at DESC
  )
  INTO v_result
  FROM pt_client_relationships pcr
  INNER JOIN auth.users u ON u.id = pcr.client_id
  LEFT JOIN profiles p ON p.user_id = pcr.client_id
  LEFT JOIN LATERAL (
    -- Subquery prevents fan-out from multiple shared programmes
    SELECT
      COUNT(*)::INTEGER AS count,
      JSONB_AGG(
        JSONB_BUILD_OBJECT('id', sp.id, 'programmeId', sp.programme_id)
      ) AS programmes
    FROM shared_programmes sp
    WHERE sp.pt_id = p_pt_id AND sp.client_id = pcr.client_id
  ) sp_counts ON TRUE
  WHERE pcr.pt_id = p_pt_id AND pcr.status = 'active';

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_pt_clients_optimized(UUID) TO authenticated;

COMMENT ON FUNCTION public.list_pt_clients_optimized(UUID) IS
  'Optimized PT client list. Replaces 4 queries with 1 RPC. Returns JSONB array.';

-- =====================================================
-- COVERING INDEX FOR OPTIMAL QUERY PERFORMANCE
-- =====================================================

-- Composite index covering the main query pattern
CREATE INDEX IF NOT EXISTS idx_pt_clients_optimized_covering
  ON pt_client_relationships(pt_id, status, created_at DESC)
  INCLUDE (id, client_id);

-- Ensure shared_programmes index exists
CREATE INDEX IF NOT EXISTS idx_shared_programmes_pt_id
  ON shared_programmes(pt_id)
  INCLUDE (client_id, id, programme_id);

-- Update statistics for query planner
ANALYZE pt_client_relationships;
ANALYZE shared_programmes;
ANALYZE profiles;
