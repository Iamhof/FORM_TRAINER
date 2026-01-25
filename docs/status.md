# Environment & Governance Audit — 2025-11-09

## Repository & Branch Inventory
- Observed directory `form-pt-app` does not contain a `.git` folder; `git status -sb` fails with `fatal: not a git repository`.  
  Action: rehydrate the git metadata (clone fresh or copy `.git`) so branches/PRs can be tracked.
- Because the repo is detached from git, no current branch list or open PR inventory could be produced locally.

## Supabase Project Alignment
- Discovered Supabase project ref from `env`: `https://yshbcfifmkflhahjengk.supabase.co` (`yshbcfifmkflhahjengk`).
- Service credentials present in local `env` file (`EXPO_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). Ensure secure storage before sharing.
- Supabase CLI accessible via `npx supabase`; current version `2.54.11`.
- `npx supabase db diff --linked` currently fails: `Cannot find project ref. Have you run supabase link?`  
  Action: run `npx supabase link --project-ref yshbcfifmkflhahjengk` with a valid access token (`SUPABASE_ACCESS_TOKEN`) and reattempt the diff.

## Schema Baseline
- `supabase/migrations/_baseline.sql` reserved for the captured schema diff once linking succeeds.
- Until linking is restored, use existing SQL snapshots (`COMPLETE_DATABASE_SETUP.sql`, `SUPABASE_MIGRATION.sql`) as reference only; they are not an authoritative baseline.

## Tracking & Checkpoints
- Created `docs/status.md` as the running changelog per plan.  
- Recommended next steps:
  - Stand up a project tracker (Notion/Jira) with owners and review cadence once git linkage is restored.
  - Schedule auth/data-contract checkpoints aligned with planned phase milestones.


