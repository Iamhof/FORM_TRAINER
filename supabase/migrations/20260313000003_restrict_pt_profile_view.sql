-- Migration: Restrict pt_profile_view to service_role only
-- Why: This view joins auth.users and exposes every user's email to any
-- authenticated user via PostgREST. All backend PT routes use supabaseAdmin
-- (service_role), so authenticated access is unnecessary.

REVOKE SELECT ON public.pt_profile_view FROM authenticated;
REVOKE SELECT ON public.pt_profile_view FROM anon;
GRANT SELECT ON public.pt_profile_view TO service_role;
