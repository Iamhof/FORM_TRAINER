# ADR 001: Adopt Supabase Native Auth & PT Data Refactor

- **Date:** 2025-11-10  
- **Status:** Accepted  
- **Owners:** Core team

## Context

Legacy authentication and PT flows relied on a bespoke `public.users` table, manual password hashing, and ad-hoc data fetching. This caused drift with Supabase managed tables, made token verification fragile, and complicated future feature upgrades (programme sharing, analytics, scheduling).

## Decision

1. Switch to Supabase native authentication (`supabase.auth`) for all sign-in/sign-up flows, exposing a single backend helper (`supabaseAdmin`) and guard (`assertServiceKeys`) to bootstrap services safely.
2. Introduce a consolidated `pt_profile_view` and shared `getProfileByUserId` helper so downstream routers always get `{ id, email, name, is_pt }` in a consistent shape.
3. Move workout logging, analytics aggregation, and schedule mutation logic into Supabase RPCs (`log_workout_transaction`, `get_volume`, `get_strength_trend`, `toggle_schedule_day`) to maintain transactional integrity.
4. Refactor TRPC routers and frontline contexts (Analytics, Schedule) to consume the new RPC contracts, ensuring mobile clients stay thin and stateless.

## Consequences

- **Positive:** Native auth & profile access are now uniform across backend and app; schedule mutations and workout logging are transactionally safe; PT client workflows use consistent data contracts; contexts hydrate through typed TRPC endpoints (simpler caching and unit coverage).
- **Negative:** Requires Supabase CLI access for migrations and RPC updates; local setup must provide service role keys; additional CI steps (Supabase policy diff) introduced.
- **Follow-up:** Monitor Supabase RPC performance and ensure staging runs migrations before production; expand automated coverage for invite/cancel flows.
