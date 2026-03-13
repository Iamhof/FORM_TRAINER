# FORM_TRAINER — Claude Instructions

## Project

- **Name**: FORM
- **What it does**: Workout tracking mobile app (iOS, Android, web) for creating training programmes, logging workouts, tracking analytics/PRs, competing on leaderboards, and PT client management.
- **Stack**: React Native + Expo SDK 54 + Expo Router, Hono + tRPC backend, TypeScript strict mode
- **Database**: Supabase (PostgreSQL + Auth + RLS enabled on every table)
- **API pattern**: tRPC (type-safe, one folder per domain in `backend/trpc/routes/`)
- **State**: Zustand (local), React Query + tRPC (server)
- **Auth**: Supabase Auth via `expo-secure-store` (native) / `localStorage` (web) — see `SecureStoreAdapter` in `lib/supabase.ts`
- **Key dependencies**: RevenueCat (payments), Sentry (monitoring), Zod (validation), react-native-reanimated (animations), lucide-react-native (icons), expo-haptics (tactile feedback)
- **Package manager**: Bun (use `bun` not `npm`)

## Commands

```bash
bun i                    # Install dependencies
bun run start            # Start Expo dev server
bun run start-web        # Start web preview
bun run lint             # ESLint (zero warnings policy)
bun run lint:fix         # ESLint with auto-fix
bun run typecheck        # tsc --noEmit (strict)
bun run test             # Vitest (unit tests)
bun run test:watch       # Vitest watch mode
bun run e2e              # Playwright e2e tests
bun run ci               # Full CI check: lint + typecheck + test
bun run backend:dev      # Start Hono/tRPC backend locally
```

Always run `bun run ci` before considering any task complete.

## Workflow

### Planning

- Any task touching 2+ files: enter Plan mode first (shift+tab twice)
- List every file that will be created, modified, or deleted
- Identify risks and edge cases before writing code
- Do NOT write code until the plan is approved
- For large features: break into numbered steps, implement and commit each step separately
- If something goes wrong mid-implementation: STOP and re-plan immediately — do not keep pushing a broken approach

### Verification

- Run `bun run test` and `bun run typecheck` after every meaningful change
- If no tests exist for the code being changed, write tests FIRST
- For UI changes: describe exactly what to verify visually
- Never mark a task complete without `bun run ci` passing
- If tests fail: fix them immediately — do not move on to the next step
- If stuck after 3 attempts at fixing: STOP, explain the blocker, and suggest options

### Commits

- Commit after each completed step, not at the end of a task
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- Commit messages explain WHY, not just what
- Never commit failing tests or type errors

### Sub-Agents

- Use sub-agents when a task spans 3+ files or involves separate concerns
- Typical splits: backend tRPC route + frontend context/screen + tests
- Main agent orchestrates and reviews — sub-agents implement
- Each sub-agent gets: one clear objective, scoped file access, and a definition of done

## Project Structure

```
app/                     # Screens (Expo Router file-based routing)
  (tabs)/                # Tab navigation: home, workouts, exercises, progress, profile, analytics, leaderboard
  session/               # Active workout session screens
  programme/             # Programme viewing
  create-programme/      # Programme creation flow
  pt/                    # Personal trainer screens
  auth.tsx               # Auth screen
  onboarding.tsx         # Onboarding flow
  paywall.tsx            # Subscription paywall
backend/
  hono.ts                # Hono server entry point
  trpc/routes/           # tRPC route handlers (one folder per domain)
  services/              # Backend business logic (e.g. xp.service.ts)
  lib/                   # Backend utilities (auth, runtime-utils)
components/              # Shared UI components
contexts/                # React contexts (User, Programme, Schedule, Leaderboard, etc.)
hooks/                   # Custom hooks
lib/                     # Frontend utilities (supabase client, trpc client, logger, env, cache)
constants/               # Theme (COLORS, SPACING, NEON, TYPOGRAPHY), exercise library, XP config
types/                   # TypeScript types (database.ts is the canonical schema reference)
supabase/
  migrations/            # SQL migration files (timestamp-prefixed)
  schema.sql             # Current complete database schema
  seed_exercises.sql     # Exercise seed data
tests/                   # Vitest unit tests + Playwright e2e
  setup/                 # Test setup (vitest-minimal.setup.ts)
  lib/                   # Lib/backend tests
  e2e/                   # End-to-end tests
  security/              # Security tests
```

## Key Patterns — Follow These Files as Examples

- **New component**: follow `components/GlowCard.tsx` (simple) or `components/ExerciseCard.tsx` (with props/data)
- **New tRPC route**: follow `backend/trpc/routes/workouts/` (CRUD domain pattern)
- **New hook**: follow `hooks/useExerciseFilters.ts`
- **New context**: follow `contexts/UserContext.tsx` (provider + consumer pattern with camelCase mapping)
- **New backend service**: follow `backend/services/xp.service.ts`
- **New unit test**: follow `tests/lib/error-utils.test.ts`
- **New migration**: timestamp-prefixed SQL file in `supabase/migrations/`

## Do NOT Touch

These files require explicit human approval before any modification:

- `app/_layout.tsx` — provider ordering chain is load-bearing (see Architecture Rules)
- `lib/crash-protection.ts` — must initialize before all other code
- `lib/supabase.ts` — auth storage adapter, manually maintained
- `lib/env.ts` — env validation schema, manual changes only
- `.env*` — environment files, never read or write
- `bun.lock` — never edit directly
- `supabase/migrations/` — never modify EXISTING migration files (new ones are fine)
- `backend/hono.ts` — server entry point, rarely changes
- `constants/theme.ts` — design system constants, change only with designer approval

## Architecture Rules

- **Path alias**: Use `@/` for all imports (maps to project root). Never use relative `../` beyond one level.
- **Import order**: Enforced by ESLint — builtin > external > internal > parent/sibling > index > type. Alphabetised within groups, blank lines between groups.
- **no-console rule**: `console.log` is banned. Use `logger.debug/info/warn/error` from `@/lib/logger` instead. Tests are exempt.
- **Database types** use `snake_case` (matching PostgreSQL). Application types use `camelCase`. The mapping happens in contexts and tRPC routes — see `types/database.ts` header comment.
- **Env validation**: All env vars are validated with Zod in `lib/env.ts`. Client-side vars must be prefixed `EXPO_PUBLIC_`. Never access `process.env` directly — import from `@/lib/env`.
- **Error handling**: The app uses `ErrorBoundary` + `EnvCheck` at root. Supabase client gracefully degrades with a placeholder if env vars are missing. Never let uncaught errors crash the app.
- **Provider ordering** in `_layout.tsx` matters — don't reorder without understanding the dependency chain: ErrorBoundary > EnvCheck > QueryClient > tRPC > User > Subscription > Theme > Programme > Analytics > Schedule > BodyMetrics > Leaderboard.

## Code Rules

- 2-space indentation, no tabs
- Strict TypeScript: `noImplicitAny`, `strictNullChecks`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`
- Prefer `const` over `let`. Never use `var`. Zero `any` types — use `unknown` and narrow.
- Functional components with hooks only. No class components.
- Named exports only — no default exports. Export types with `export interface` or `export type`.
- Name component files `PascalCase.tsx`. Name utility/lib files `kebab-case.ts`.
- Use Zod for all runtime validation (API inputs, env vars, form data).
- Never swallow errors: log with context via `@/lib/logger` or propagate.
- No new dependencies without checking if an existing one covers the need.

## UI & Styling

- Dark theme only. Background: `#08080A`. Use constants from `constants/theme.ts` — never hardcode colors.
- The neon/glow aesthetic uses `NEON` constants for purple glow borders, gradients, and chromatic effects.
- User-selectable accent colors defined in `COLORS.accents`. Access via `UserContext`.
- Icons: `lucide-react-native` exclusively. No other icon libraries.
- Use `expo-haptics` for tactile feedback on user interactions.
- Animations: `react-native-reanimated` for performant native animations.
- No inline styles — use `StyleSheet.create` with theme constants.

## Testing

- **Unit tests**: Vitest in `tests/` directory. Test setup in `tests/setup/vitest-minimal.setup.ts`.
- **E2E tests**: Playwright in `tests/e2e/` directory.
- Tests exclude app/, components/, contexts/, hooks/, constants/, types/ directories (React Native code). Backend and lib code are testable.
- Run a single relevant test file during development, not the full suite.
- Run the full suite (`bun run ci`) only before committing.

## Database & Migrations

- All migrations in `supabase/migrations/` with timestamp-prefixed filenames.
- RLS is enabled on every table, no exceptions. New tables MUST have RLS policies.
- Never modify existing migration files. Create new migrations for schema changes.
- Reference `supabase/schema.sql` for the current complete schema.
- All inputs sanitized with parameterized queries.

## Security

- Secrets in env vars only — never hardcoded, never logged, never committed
- Auth via Supabase Auth — never hand-rolled
- Supabase RLS enabled on every table, no exceptions
- All inputs validated with Zod, sanitized with parameterized queries
- Validate uploads by file signature, not extension
- CORS restricted to allow-listed production domains
- Remove all `console.log` before production (enforced by ESLint)

## Common Gotchas

- Expo Router uses file-based routing — the file path IS the route. Adding/removing files in `app/` changes the app's navigation.
- The Supabase client can be in an `__isInvalid` state if env vars are missing. Always check before making DB calls in new code.
- `react-native-web` compatibility: some RN APIs don't work on web. Check `Platform.OS` when using native-only features.
- tRPC routes need `.js` extensions in imports when deployed to Vercel (Node16 module resolution).
- The `refetchOnWindowFocus` is intentionally disabled in React Query to prevent "thundering herd" on app foreground.
- The crash-protection system (`lib/crash-protection.ts`) must be initialized before any other code in the root layout.

## Failure Handling

- Build fails -> fix before doing anything else
- Tests fail -> fix immediately, do not skip or comment out
- Type errors -> resolve before committing
- Stuck after 3 attempts -> STOP, explain what you tried, describe the blocker, suggest options
- Unclear requirements -> ask for clarification, do not guess
- Conflicting patterns in codebase -> flag the inconsistency, ask which to follow

## Learned Rules

At the start of every session, read `tasks/lessons.md` before doing anything else.

When corrected by the developer, suggest a rule and append it to `tasks/lessons.md`. The developer will approve.

Format: `NEVER/ALWAYS [specific behaviour] — YYYY-MM-DD`
