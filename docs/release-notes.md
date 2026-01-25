# Release Notes

## v1.0.0 - November 2025

- **Auth & PT foundation**: migrated to Supabase native auth, consolidated PT profile lookup, and restored invite -> accept -> share workflows across mobile + backend.
- **Data integrity**: added Supabase RPCs (`log_workout_transaction`, `get_volume`, `get_strength_trend`, `toggle_schedule_day`) with TRPC wrappers and frontend contexts that hydrate via typed endpoints.
- **Analytics refresh**: shared loading/empty states, accessible cards, and Bun-powered Vitest coverage for core flows.
- **Tooling**: Husky + lint-staged (Bun), comprehensive CI (lint, typecheck, Vitest, Playwright smoke tests, Supabase policy snapshot).
- **UX polish**: reusable `ScreenState` component, clearer PT client invitation management (resend/cancel), improved analytics/body metric empty states, accessible headers.

> For historical ADRs and architectural rationale, see `docs/adr/`.
