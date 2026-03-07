# Form App - Action Plan

**Generated:** 2026-02-02
**Source:** FULL_AUDIT.md (Passes 1-5)

---

## DEPENDENCY MAP

```
PHASE 0 (Critical Blockers)
├── 0.1 Delete projects/ directory ─────────────────────────────> (no dependencies)
├── 0.2 Remove tunnel mode default ─────────────────────────────> (no dependencies)
└── 0.3 Fix programme saving ───────────────────────────────────> depends on 0.2
        ├── 0.3a Add loading state
        └── 0.3b Add error display

PHASE 1 (Security) - Can start after 0.1, 0.2
├── 1.1 Audit RLS policies ─────────────────────────────────────> (no dependencies)
├── 1.2 Verify service role not in client bundle ───────────────> (no dependencies)
└── 1.3 Review public endpoints ────────────────────────────────> (no dependencies)

PHASE 2 (Stability) - Can start after Phase 0
├── 2.1 Replace console.* with logger ──────────────────────────> (no dependencies)
├── 2.2 Type error catch blocks ────────────────────────────────> (no dependencies)
└── 2.3 Add loading/empty states ───────────────────────────────> after 0.3

PHASE 3 (Performance) - Can start after Phase 0
├── 3.1 Set analytics staleTime ────────────────────────────────> (no dependencies)
├── 3.2 Add exercises pagination ───────────────────────────────> (no dependencies)
├── 3.3 Add workout history limit ──────────────────────────────> (no dependencies)
├── 3.4 Replace SELECT * queries ───────────────────────────────> (no dependencies)
└── 3.5 Move analytics to PostgreSQL ───────────────────────────> after 3.1

PHASE 4 (Code Quality) - Ongoing
├── 4.1 Create isDev utility ───────────────────────────────────> (no dependencies)
├── 4.2 Create typed navigation helper ─────────────────────────> (no dependencies)
├── 4.3 Add auth flow tests ────────────────────────────────────> after Phase 0
└── 4.4 Add programme CRUD tests ───────────────────────────────> after 0.3

PHASE 5 (Infrastructure) - Before launch
├── 5.1 Enable Sentry performance ──────────────────────────────> (no dependencies)
├── 5.2 Verify environment variables ───────────────────────────> (no dependencies)
└── 5.3 Enable connection pooling ──────────────────────────────> after 3.5

PHASE 6 (Feature Prep) - After launch stable
├── 6.1 Create analytics_summary table ─────────────────────────> (no dependencies)
├── 6.2 Create leaderboard materialized view ───────────────────> (no dependencies)
└── 6.3 Enable provider contexts ───────────────────────────────> after 6.1, 6.2
```

---

## PHASE 0 — CRITICAL BLOCKERS

> Do before anything else. These prevent core functionality or cause immediate problems.

---

### 0.1 Delete Duplicate `projects/` Directory

**Description:** Remove 38 duplicate backend files that cause confusion and potential sync issues.

**Files Affected:**
- `projects/4d44d50b-a59d-4dd3-9519-4d00e3780829/` (entire directory)
- `.gitignore`
- `eslint.config.js`

**Exact Fix:**

```bash
# Step 1: Delete the directory
rm -rf projects/
```

```gitignore
# Step 2: Add to .gitignore
projects/
```

```javascript
// Step 3: Add to eslint.config.js ignores (line 9)
{
  ignores: ["dist/*", "supabase/migrations/**", "projects/**"],
},
```

**Dependencies:** None

**Effort:** S (5 minutes)

**Risk if Unfixed:** Developers may accidentally edit wrong files; 38 duplicate files with potentially outdated code; ESLint errors from duplicate files.

---

### 0.2 Remove Tunnel Mode as Default

**Description:** The default `npm run dev` uses `--tunnel` flag, which breaks tRPC API routes on native devices.

**Files Affected:**
- `package.json`

**Exact Fix:**

```json
// package.json - Change scripts section
{
  "scripts": {
    "dev": "expo start",
    "dev:tunnel": "expo start --tunnel",
    "dev:web": "expo start --web",
    "dev:web:tunnel": "expo start --web --tunnel",
    "dev:web:debug": "cross-env DEBUG=expo* expo start --web",
    // ... rest unchanged
  }
}
```

**Dependencies:** None

**Effort:** S (5 minutes)

**Risk if Unfixed:** Programme saving and all API calls fail silently when using default dev command; users and developers confused by "Save" button doing nothing.

---

### 0.3 Fix Programme Saving Issue

**Description:** Clicking "Save Programme" does nothing - no loading state, silent failures, no user feedback.

**Files Affected:**
- `app/create-programme/review.tsx`

**Exact Fix:**

```typescript
// app/create-programme/review.tsx

// Add state at top of component (after line 27)
const [isSaving, setIsSaving] = React.useState(false);

// Replace handleSave function (lines 34-81) with:
const handleSave = async () => {
  if (isSaving) return; // Prevent double-tap

  try {
    const exercises: any[] = [];

    days.forEach((day, dayIndex) => {
      day.exercises.forEach(exercise => {
        exercises.push({
          day: dayIndex + 1,
          exerciseId: exercise.id,
          sets: exercise.sets,
          reps: exercise.reps.toString(),
          rest: exercise.rest,
        });
      });
    });

    if (!programmeName || programmeName.trim() === '') {
      Alert.alert('Error', 'Please enter a programme name.');
      return;
    }

    if (exercises.length === 0) {
      Alert.alert('Error', 'Please add at least one exercise to your programme.');
      return;
    }

    setIsSaving(true);

    logger.debug('[ReviewScreen] Creating programme:', {
      name: programmeName,
      days: frequency,
      weeks: duration,
      exerciseCount: exercises.length,
    });

    await addProgramme({
      name: programmeName,
      days: frequency,
      weeks: duration,
      exercises,
    });

    logger.debug('[ReviewScreen] Programme saved successfully');
    router.push('/(tabs)/home');
  } catch (error) {
    logger.error('[ReviewScreen] Failed to save programme:', error);
    const errorMessage = error instanceof Error
      ? error.message
      : 'Failed to save programme. Please try again.';
    Alert.alert('Save Failed', errorMessage);
  } finally {
    setIsSaving(false);
  }
};

// Update Button component (around line 140-145)
<Button
  title={isSaving ? "Saving..." : "Save Programme"}
  onPress={handleSave}
  variant="primary"
  style={styles.continueButton}
  disabled={isSaving}
/>

// Add import at top
import { Alert } from 'react-native';
```

**Dependencies:** 0.2 (tunnel mode fix) - programme saving will still fail if tunnel mode is used

**Effort:** M (1-2 hours to implement and test)

**Risk if Unfixed:** Core feature completely broken; users cannot create programmes; app unusable for primary use case.

---

## PHASE 1 — SECURITY HARDENING

> Do before public launch. Protects user data and prevents unauthorized access.

---

### 1.1 Audit and Verify RLS Policies

**Description:** Ensure all tables have proper Row Level Security policies that restrict access to own data only.

**Files Affected:**
- `supabase/migrations/20250116_fix_performance_and_security.sql` (reference)
- New migration file if changes needed

**Audit Checklist:**

| Table | Expected Policy | Verify |
|-------|-----------------|--------|
| `profiles` | Users see/update only own profile | ✅ Has policies |
| `programmes` | Users see/update only own programmes | ✅ Has policies |
| `workouts` | Users see/update only own workouts | ✅ Has policies |
| `analytics` | Users see only own analytics | ✅ Has policies |
| `schedules` | Users see only own schedules | ✅ Has policies |
| `body_metrics` | Users see only own metrics | ✅ Has policies |
| `personal_records` | Users see only own records | ✅ Has policies |
| `pt_client_relationships` | PTs see own clients, clients see own PT | ✅ Has policies |
| `shared_programmes` | PTs see shares they created, clients see shares to them | ✅ Has policies |
| `leaderboard_profiles` | Public read for opted-in, own write | ✅ Has policies |
| `leaderboard_stats` | Public read for opted-in, system write | ✅ Has policies |
| `exercises` | Public read (intentional) | ✅ Public |

**Verification SQL (run in Supabase SQL Editor):**

```sql
-- Check RLS is enabled on all tables
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Should show rowsecurity = true for all tables except 'exercises'
```

**Dependencies:** None

**Effort:** M (2-3 hours for thorough review)

**Risk if Unfixed:** User A could potentially read/modify User B's data; GDPR/privacy violations; data leakage.

---

### 1.2 Verify Service Role Key Not Exposed

**Description:** Confirm `SUPABASE_SERVICE_ROLE_KEY` is server-only and never bundled in client app.

**Files Affected:**
- `lib/env.ts` (verify)
- `backend/lib/auth.ts` (verify)
- `.env.example` (verify documentation)

**Verification Steps:**

```bash
# Step 1: Check that service role is not in EXPO_PUBLIC_ vars
grep -r "EXPO_PUBLIC.*SERVICE" .

# Should return nothing - service role should never be public

# Step 2: Verify it's only used in backend
grep -r "SUPABASE_SERVICE_ROLE_KEY" .

# Should only appear in:
# - backend/lib/auth.ts
# - .env.example (as documentation)
# - vercel.json (possibly)
```

**Current Status:** ✅ Correct - `supabaseAdmin` in `backend/lib/auth.ts` uses `process.env.SUPABASE_SERVICE_ROLE_KEY` which is server-only.

**Dependencies:** None

**Effort:** S (30 minutes to verify)

**Risk if Unfixed:** If service role key leaked to client, attackers could bypass all RLS and access/modify any data.

---

### 1.3 Review Public Endpoints

**Description:** Verify that endpoints marked as `publicProcedure` should actually be public.

**Files Affected:**
- `backend/trpc/routes/exercises/list/route.ts`
- `backend/trpc/routes/leaderboard/get-rankings/route.ts`
- `backend/trpc/routes/example/hi/route.ts`

**Current Public Endpoints:**

| Endpoint | File | Should be Public? |
|----------|------|-------------------|
| `exercises.list` | `exercises/list/route.ts` | ✅ Yes - exercise library is shared |
| `leaderboard.getRankings` | `leaderboard/get-rankings/route.ts` | ✅ Yes - public rankings by design |
| `example.hi` | `example/hi/route.ts` | ⚠️ Review - health check, probably fine |

**Recommendation:** No changes needed, but document why these are public.

**Dependencies:** None

**Effort:** S (30 minutes)

**Risk if Unfixed:** Low - current public endpoints are intentionally public.

---

## PHASE 2 — STABILITY & ERROR HANDLING

> Do before public launch. Prevents crashes and improves user experience.

---

### 2.1 Replace console.* with Logger

**Description:** Two files use `console.*` instead of the logger, violating ESLint rules.

**Files Affected:**
- `contexts/ScheduleContext.tsx` (line 66)
- `components/ExerciseSelectorModal.tsx` (line 50)

**Exact Fix:**

```typescript
// contexts/ScheduleContext.tsx - line 66
// Change:
console.log('Schedule loaded:', data);
// To:
logger.debug('[ScheduleContext] Schedule loaded:', data);

// Add import if not present:
import { logger } from '@/lib/logger';
```

```typescript
// components/ExerciseSelectorModal.tsx - line 50
// Change:
console.error('Error loading exercises:', error);
// To:
logger.error('[ExerciseSelectorModal] Error loading exercises:', error);

// Add import if not present:
import { logger } from '@/lib/logger';
```

**Dependencies:** None

**Effort:** S (15 minutes)

**Risk if Unfixed:** ESLint errors; inconsistent logging; console.log stripped in production builds.

---

### 2.2 Type Error Catch Blocks with `unknown`

**Description:** 12 catch blocks use `error: any` which bypasses TypeScript safety.

**Files Affected:**
- `contexts/UserContext.tsx` (lines 180, 215, 249)
- `contexts/LeaderboardContext.tsx` (lines 292, 305)
- `app/edit-profile.tsx` (line 137)
- `app/pt/clients.tsx` (lines 38, 57, 161, 185)
- `app/pt/client/[id].tsx` (lines 54, 77)

**Exact Fix Pattern:**

```typescript
// Before:
} catch (error: any) {
  const message = error.message;
  logger.error('Error:', error);
}

// After:
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  logger.error('Error:', error);
}
```

**Create Helper (optional but recommended):**

```typescript
// lib/errors.ts (new file)
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}
```

**Dependencies:** None

**Effort:** M (2 hours)

**Risk if Unfixed:** TypeScript type safety bypassed; potential runtime errors if error is not an Error object.

---

### 2.3 Add Loading/Empty States to Key Screens

**Description:** Several screens lack proper loading and empty state handling.

**Files Affected:**
- `app/(tabs)/home.tsx`
- `app/(tabs)/workouts.tsx`
- `app/pt/clients.tsx`

**Exact Fix Pattern:**

```typescript
// Example for home.tsx - add loading skeleton
if (isLoading) {
  return (
    <View style={styles.container}>
      <View style={styles.skeletonCard} />
      <View style={styles.skeletonCard} />
    </View>
  );
}

// Example for empty state
if (!programmes || programmes.length === 0) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No programmes yet</Text>
      <Text style={styles.emptySubtitle}>Create your first programme to get started</Text>
      <Button title="Create Programme" onPress={() => router.push('/create-programme')} />
    </View>
  );
}
```

**Dependencies:** 0.3 (programme saving should work first)

**Effort:** M (2-3 hours)

**Risk if Unfixed:** Users see blank screens while loading; confusion about whether app is working.

---

## PHASE 3 — PERFORMANCE & OPTIMIZATION

> Do before scaling. Prevents slowdowns and excessive resource usage.

---

### 3.1 Set Analytics staleTime to 5 Minutes

**Description:** Analytics queries have `staleTime: 0` causing refetch on every mount.

**Files Affected:**
- `contexts/AnalyticsContext.tsx` (lines 50-69)

**Exact Fix:**

```typescript
// contexts/AnalyticsContext.tsx

// Line 50-59: overviewQuery
const overviewQuery = trpc.analytics.overview.useQuery(
  { months: 6, programmeDays: activeProgramme?.days ?? 3 },
  {
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes instead of 0
  }
);

// Line 61-69: volumeQuery
const volumeQuery = trpc.analytics.getVolume.useQuery(
  { period: volumePeriod },
  {
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes instead of 0
  }
);
```

**Dependencies:** None

**Effort:** S (5 minutes)

**Risk if Unfixed:** Excessive API calls; slow analytics page; poor battery/data usage; serverless function overload.

---

### 3.2 Add Pagination to Exercises Endpoint

**Description:** Exercises endpoint returns ALL exercises with no limit, causing slow loads as library grows.

**Files Affected:**
- `backend/trpc/routes/exercises/list/route.ts`

**Exact Fix:**

```typescript
// backend/trpc/routes/exercises/list/route.ts

import { z } from 'zod';
import { publicProcedure } from '../../../create-context.js';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth.js';
import { logger } from '@/lib/logger';

export const listExercisesProcedure = publicProcedure
  .input(z.object({
    limit: z.number().min(1).max(100).default(50),
    offset: z.number().min(0).default(0),
    category: z.string().optional(),
    search: z.string().optional(),
  }).optional())
  .query(async ({ input }) => {
    const { limit = 50, offset = 0, category, search } = input ?? {};

    let query = supabaseAdmin
      .from('exercises')
      .select('id, name, category, muscle_groups, thumbnail', { count: 'exact' })
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: exercises, error, count } = await query;

    if (error) {
      logger.error('Error fetching exercises:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch exercises',
      });
    }

    return {
      exercises: exercises || [],
      total: count || 0,
      hasMore: (offset + limit) < (count || 0),
    };
  });
```

**Dependencies:** None

**Effort:** S (1 hour)

**Risk if Unfixed:** As exercise library grows to 500+, every user downloads entire library on app load; slow initial load; high bandwidth usage.

---

### 3.3 Add Default Limit to Workout History

**Description:** Workout history has optional limit that defaults to ALL workouts.

**Files Affected:**
- `backend/trpc/routes/workouts/history/route.ts`

**Exact Fix:**

```typescript
// backend/trpc/routes/workouts/history/route.ts

// Change input schema to have required default limit
.input(z.object({
  limit: z.number().min(1).max(100).default(50), // Add default
  offset: z.number().min(0).default(0),          // Add pagination
  programmeId: z.string().uuid().optional(),
}))

// Always apply limit (remove the if check)
const query = supabaseAdmin
  .from('workouts')
  .select('id, programme_id, programme_name, day, week, completed_at')
  .eq('user_id', ctx.userId)
  .order('completed_at', { ascending: false })
  .range(offset, offset + limit - 1);
```

**Dependencies:** None

**Effort:** S (30 minutes)

**Risk if Unfixed:** Active users with 100+ workouts fetch entire history; slow loads; high memory usage on mobile.

---

### 3.4 Replace SELECT * with Specific Columns

**Description:** 5 routes use `SELECT *` instead of specific columns, fetching unnecessary data.

**Files Affected:**
- `backend/trpc/routes/workouts/history/route.ts`
- `backend/trpc/routes/programmes/list/route.ts`
- `backend/trpc/routes/exercises/list/route.ts`
- `backend/trpc/routes/pt/list-clients/route.ts`
- `backend/trpc/routes/analytics/get/route.ts`

**Exact Fixes:**

```typescript
// workouts/history/route.ts
.select('id, programme_id, programme_name, day, week, completed_at')
// NOT: .select('*')  // Removes exercises JSONB

// programmes/list/route.ts
.select('id, name, days, weeks, created_at, updated_at')
// NOT: .select('*')  // Removes exercises JSONB for list view

// exercises/list/route.ts (already fixed in 3.2)
.select('id, name, category, muscle_groups, thumbnail')

// pt/list-clients/route.ts
.select('id, pt_id, client_id, status, created_at')
// NOT: .select('*')

// analytics/get/route.ts
.select('id, exercise_id, date, max_weight, total_volume, total_reps')
// NOT: .select('*')
```

**Dependencies:** None

**Effort:** S (2 hours)

**Risk if Unfixed:** Excessive data transfer; slower queries; higher memory usage; especially bad for JSONB columns.

---

### 3.5 Move Analytics Aggregation to PostgreSQL

**Description:** Analytics aggregation happens in JavaScript with O(n*m) complexity, causing 1-2 second response times.

**Files Affected:**
- `backend/trpc/routes/analytics/utils.ts`
- `backend/trpc/routes/analytics/overview/route.ts`
- New SQL migration file

**Exact Fix - SQL Migration:**

```sql
-- supabase/migrations/YYYYMMDD_analytics_aggregation.sql

-- Create function to aggregate analytics in database
CREATE OR REPLACE FUNCTION get_analytics_overview(
  p_user_id UUID,
  p_months INT DEFAULT 6
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'monthlyVolume', (
      SELECT COALESCE(json_agg(monthly_data ORDER BY month), '[]'::json)
      FROM (
        SELECT
          DATE_TRUNC('month', date)::date as month,
          SUM(total_volume) as volume,
          COUNT(DISTINCT date) as sessions
        FROM analytics
        WHERE user_id = p_user_id
          AND date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month' * p_months)
        GROUP BY DATE_TRUNC('month', date)
      ) monthly_data
    ),
    'topExercises', (
      SELECT COALESCE(json_agg(exercise_data ORDER BY total_volume DESC), '[]'::json)
      FROM (
        SELECT
          exercise_id,
          SUM(total_volume) as total_volume,
          MAX(max_weight) as max_weight,
          COUNT(*) as session_count
        FROM analytics
        WHERE user_id = p_user_id
          AND date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month' * p_months)
        GROUP BY exercise_id
        LIMIT 10
      ) exercise_data
    ),
    'totalVolume', (
      SELECT COALESCE(SUM(total_volume), 0)
      FROM analytics
      WHERE user_id = p_user_id
        AND date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month' * p_months)
    ),
    'totalSessions', (
      SELECT COUNT(DISTINCT date)
      FROM analytics
      WHERE user_id = p_user_id
        AND date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month' * p_months)
    )
  ) INTO result;

  RETURN result;
END;
$$;
```

**Backend Update:**

```typescript
// backend/trpc/routes/analytics/overview/route.ts
export const overviewProcedure = protectedProcedure
  .input(z.object({ months: z.number().default(6) }))
  .query(async ({ ctx, input }) => {
    const { data, error } = await supabaseAdmin
      .rpc('get_analytics_overview', {
        p_user_id: ctx.userId,
        p_months: input.months,
      });

    if (error) {
      logger.error('[Analytics] Overview query failed:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to load analytics',
      });
    }

    return data;
  });
```

**Dependencies:** 3.1 (staleTime should be set first to reduce load during transition)

**Effort:** L (1-2 days)

**Risk if Unfixed:** Analytics page takes 1-2 seconds to load; serverless timeouts at scale; poor user experience.

---

## PHASE 4 — CODE QUALITY & MAINTAINABILITY

> Ongoing improvements. Makes codebase easier to maintain and extend.

---

### 4.1 Create isDev Utility Function

**Description:** 7 files duplicate the `(global as any).__DEV__` pattern.

**Files Affected:**
- `lib/isDev.ts` (new file)
- `lib/logger.ts`
- `lib/trpc.ts`
- `backend/hono.ts`
- `services/error.service.ts`
- `components/ErrorBoundary.tsx`

**Exact Fix - New Utility:**

```typescript
// lib/isDev.ts (new file)

declare const __DEV__: boolean | undefined;

/**
 * Check if running in development mode.
 * Works in React Native, Expo, and Node.js environments.
 */
export function isDev(): boolean {
  // React Native / Expo
  if (typeof __DEV__ !== 'undefined') {
    return __DEV__;
  }

  // Node.js
  if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
    return process.env.NODE_ENV === 'development';
  }

  return false;
}
```

**Usage Update Example:**

```typescript
// lib/logger.ts
// Before:
const dev = (global as any).__DEV__;

// After:
import { isDev } from './isDev';
// ... then use isDev() instead of dev
```

**Dependencies:** None

**Effort:** S (30 minutes)

**Risk if Unfixed:** Code duplication; TypeScript errors; inconsistent behavior across environments.

---

### 4.2 Create Typed Navigation Helper

**Description:** 11 files use `router.push('...' as any)` pattern due to Expo Router typing issues.

**Files Affected:**
- `lib/navigation.ts` (new file)
- 11 files using `as any` for navigation

**Exact Fix - New Utility:**

```typescript
// lib/navigation.ts (new file)

import { router } from 'expo-router';

// Define all app routes
type StaticRoutes =
  | '/'
  | '/auth'
  | '/profile-setup'
  | '/edit-profile'
  | '/(tabs)/home'
  | '/(tabs)/workouts'
  | '/(tabs)/profile'
  | '/create-programme'
  | '/create-programme/exercises'
  | '/create-programme/review'
  | '/exercises'
  | '/pt/clients'
  | '/client/my-pt';

type DynamicRoutes =
  | `/programme/${string}`
  | `/session/${string}`
  | `/pt/client/${string}`;

type AppRoutes = StaticRoutes | DynamicRoutes;

/**
 * Type-safe navigation helper for Expo Router.
 * Centralizes the `as any` cast in one place.
 */
export function navigate(route: AppRoutes): void {
  router.push(route as any);
}

export function replace(route: AppRoutes): void {
  router.replace(route as any);
}

// Helper for dynamic routes
export function navigateToProgramme(id: string): void {
  router.push(`/programme/${id}` as any);
}

export function navigateToSession(id: string): void {
  router.push(`/session/${id}` as any);
}

export function navigateToClientDetail(id: string): void {
  router.push(`/pt/client/${id}` as any);
}
```

**Usage Update Example:**

```typescript
// app/(tabs)/home.tsx
// Before:
router.push(`/programme/${id}` as any);

// After:
import { navigateToProgramme } from '@/lib/navigation';
navigateToProgramme(id);
```

**Dependencies:** None

**Effort:** M (2-3 hours)

**Risk if Unfixed:** TypeScript errors throughout codebase; `as any` scattered everywhere; harder to refactor routes.

---

### 4.3 Add Authentication Flow Tests

**Description:** No tests cover signup, signin, signout flows.

**Files Affected:**
- `tests/auth.test.ts` (new file)

**Exact Fix:**

```typescript
// tests/auth.test.ts

import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import { appRouter } from '@/backend/trpc/app-router';
import { supabaseAdmin } from '@/backend/lib/auth';

// Mock Supabase
vi.mock('@/backend/lib/auth', () => ({
  supabaseAdmin: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          maybeSingle: vi.fn(),
        })),
      })),
    })),
  },
}));

describe('Auth flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('auth.me', () => {
    test('returns user profile when authenticated', async () => {
      // Setup mock
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'user-1', name: 'Test User', is_pt: false },
              error: null,
            }),
          }),
        }),
      } as any);

      const caller = appRouter.createCaller({
        req: new Request('http://localhost'),
        requestId: 'test-1',
        userId: 'user-1',
        userEmail: 'test@example.com',
      });

      const result = await caller.auth.me();
      expect(result).toHaveProperty('name', 'Test User');
    });

    test('throws UNAUTHORIZED when not authenticated', async () => {
      const caller = appRouter.createCaller({
        req: new Request('http://localhost'),
        requestId: 'test-2',
        userId: null,
        userEmail: null,
      });

      await expect(caller.auth.me()).rejects.toThrow('Not authenticated');
    });
  });
});
```

**Dependencies:** Phase 0 complete (core app should be working)

**Effort:** L (1 day)

**Risk if Unfixed:** Auth regressions go unnoticed; bugs discovered in production.

---

### 4.4 Add Programme CRUD Tests

**Description:** No tests cover programme creation, listing, deletion.

**Files Affected:**
- `tests/programmes.test.ts` (new file)

**Exact Fix:**

```typescript
// tests/programmes.test.ts

import { describe, expect, test, beforeEach, vi } from 'vitest';
import { appRouter } from '@/backend/trpc/app-router';
import { supabaseAdmin } from '@/backend/lib/auth';

vi.mock('@/backend/lib/auth');

describe('Programme CRUD', () => {
  const mockUser = {
    userId: 'user-1',
    userEmail: 'test@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('programmes.create', () => {
    test('creates programme successfully', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'prog-1', name: 'Test Programme' },
              error: null,
            }),
          }),
        }),
      } as any);

      const caller = appRouter.createCaller({
        req: new Request('http://localhost'),
        requestId: 'test-1',
        ...mockUser,
      });

      const result = await caller.programmes.create({
        name: 'Test Programme',
        days: 3,
        weeks: 4,
        exercises: [
          { day: 1, exerciseId: 'ex-1', sets: 3, reps: '10', rest: 60 },
        ],
      });

      expect(result).toHaveProperty('id', 'prog-1');
    });

    test('rejects duplicate programme names', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'existing' },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const caller = appRouter.createCaller({
        req: new Request('http://localhost'),
        requestId: 'test-2',
        ...mockUser,
      });

      await expect(
        caller.programmes.create({
          name: 'Existing Programme',
          days: 3,
          weeks: 4,
          exercises: [],
        })
      ).rejects.toThrow('already exists');
    });
  });
});
```

**Dependencies:** 0.3 (programme saving should work)

**Effort:** L (1 day)

**Risk if Unfixed:** Programme creation bugs like the current "save doesn't work" issue go undetected.

---

## PHASE 5 — PRODUCTION INFRASTRUCTURE

> Do before public launch. Ensures production stability and observability.

---

### 5.1 Enable Sentry Performance Monitoring

**Description:** Sentry is integrated but performance monitoring may not be enabled.

**Files Affected:**
- `services/error.service.ts`
- `app/_layout.tsx` (verify Sentry init)

**Exact Fix:**

```typescript
// services/error.service.ts or app/_layout.tsx (wherever Sentry is initialized)

import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,

  // Enable performance monitoring
  tracesSampleRate: 0.2, // 20% of transactions

  // Enable profiling
  profilesSampleRate: 0.1, // 10% of sampled transactions

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Only send errors in production
  enabled: process.env.NODE_ENV === 'production',

  // Capture user context
  beforeSend(event) {
    // Scrub sensitive data if needed
    return event;
  },
});
```

**Dependencies:** None

**Effort:** M (2-3 hours)

**Risk if Unfixed:** No visibility into production performance; can't identify slow endpoints; can't track user impact.

---

### 5.2 Verify Production Environment Variables

**Description:** Ensure all required environment variables are set in Vercel and EAS.

**Files Affected:**
- Vercel Dashboard
- EAS Dashboard / `eas.json`

**Checklist:**

**Vercel (Backend):**
| Variable | Required | Set? |
|----------|----------|------|
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | ⬜ Verify |
| `NODE_ENV` | Yes (= production) | ⬜ Verify |

**EAS / Expo (Mobile):**
| Variable | Required | Set? |
|----------|----------|------|
| `EXPO_PUBLIC_SUPABASE_URL` | Yes | ⬜ Verify |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes | ⬜ Verify |
| `EXPO_PUBLIC_RORK_API_BASE_URL` | Yes (production URL) | ⬜ Verify |
| `EXPO_PUBLIC_SENTRY_DSN` | Yes | ⬜ Verify |

**Dependencies:** None

**Effort:** S (30 minutes)

**Risk if Unfixed:** App fails in production; API calls go to wrong server; errors not tracked.

---

### 5.3 Enable Supabase Connection Pooling

**Description:** At scale, Supabase connection limits (50 free, 100-500 pro) could be exhausted.

**Files Affected:**
- Supabase Dashboard settings
- `backend/lib/auth.ts` (verify connection string)

**Steps:**

1. Go to Supabase Dashboard → Settings → Database
2. Enable Connection Pooling (pgBouncer)
3. Use the pooler connection string for backend:

```typescript
// backend/lib/auth.ts
// Update connection to use pooler URL
// The pooler URL format is usually:
// postgres://[user]:[password]@[project-ref].pooler.supabase.com:6543/postgres
```

**Dependencies:** 3.5 (should optimize queries first)

**Effort:** S (30 minutes)

**Risk if Unfixed:** At 1000+ concurrent users, connection pool exhaustion causes API failures.

---

## PHASE 6 — FEATURE READINESS

> For Analytics & Leaderboards. Do after core app is stable.

---

### 6.1 Create analytics_summary Table for Pre-computation

**Description:** Pre-compute monthly analytics aggregates on workout insert to eliminate O(n*m) queries.

**Files Affected:**
- New SQL migration
- `backend/trpc/routes/analytics/overview/route.ts`

**Exact Fix - SQL Migration:**

```sql
-- supabase/migrations/YYYYMMDD_analytics_summary.sql

-- Create summary table
CREATE TABLE IF NOT EXISTS public.analytics_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- First day of month
  total_volume_kg DECIMAL(12,2) DEFAULT 0,
  total_sessions INT DEFAULT 0,
  total_sets INT DEFAULT 0,
  unique_exercises INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Index for fast lookups
CREATE INDEX idx_analytics_summary_user_month
  ON analytics_summary(user_id, month DESC);

-- Enable RLS
ALTER TABLE analytics_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own summary"
  ON analytics_summary FOR SELECT
  USING (user_id = auth.uid());

-- Trigger to update summary on workout insert
CREATE OR REPLACE FUNCTION update_analytics_summary()
RETURNS TRIGGER AS $$
DECLARE
  workout_month DATE;
  workout_volume DECIMAL;
  workout_sets INT;
  exercise_count INT;
BEGIN
  workout_month := DATE_TRUNC('month', NEW.completed_at)::date;

  -- Calculate from workout JSONB
  SELECT
    COALESCE(SUM((s->>'weight')::decimal * (s->>'reps')::int), 0),
    COALESCE(COUNT(*), 0),
    COUNT(DISTINCT e->>'exerciseId')
  INTO workout_volume, workout_sets, exercise_count
  FROM jsonb_array_elements(NEW.exercises) AS e,
       jsonb_array_elements(e->'sets') AS s
  WHERE (s->>'completed')::boolean = true;

  -- Upsert summary
  INSERT INTO analytics_summary (user_id, month, total_volume_kg, total_sessions, total_sets, unique_exercises)
  VALUES (NEW.user_id, workout_month, workout_volume, 1, workout_sets, exercise_count)
  ON CONFLICT (user_id, month) DO UPDATE SET
    total_volume_kg = analytics_summary.total_volume_kg + EXCLUDED.total_volume_kg,
    total_sessions = analytics_summary.total_sessions + 1,
    total_sets = analytics_summary.total_sets + EXCLUDED.total_sets,
    unique_exercises = GREATEST(analytics_summary.unique_exercises, EXCLUDED.unique_exercises),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_workout_analytics_summary
  AFTER INSERT ON workouts
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_summary();
```

**Dependencies:** None

**Effort:** L (4-8 hours)

**Risk if Unfixed:** Analytics feature will be slow; users will see 1-2 second load times.

---

### 6.2 Create Leaderboard Materialized View

**Description:** Pre-compute leaderboard rankings for fast queries.

**Files Affected:**
- New SQL migration
- `backend/trpc/routes/leaderboard/get-rankings/route.ts`

**Exact Fix - SQL Migration:**

```sql
-- supabase/migrations/YYYYMMDD_leaderboard_view.sql

-- Create materialized view for fast ranking queries
CREATE MATERIALIZED VIEW IF NOT EXISTS leaderboard_rankings AS
SELECT
  ls.user_id,
  lp.display_name,
  lp.gender,
  ls.total_volume_kg,
  ls.monthly_volume_kg,
  ls.total_sessions,
  ls.monthly_sessions,
  RANK() OVER (ORDER BY ls.total_volume_kg DESC) as total_volume_rank,
  RANK() OVER (ORDER BY ls.monthly_volume_kg DESC) as monthly_volume_rank,
  RANK() OVER (ORDER BY ls.total_sessions DESC) as total_sessions_rank,
  RANK() OVER (ORDER BY ls.monthly_sessions DESC) as monthly_sessions_rank
FROM leaderboard_stats ls
JOIN leaderboard_profiles lp ON ls.user_id = lp.user_id
WHERE lp.is_opted_in = true;

-- Index for fast lookups
CREATE UNIQUE INDEX idx_leaderboard_rankings_user
  ON leaderboard_rankings(user_id);

CREATE INDEX idx_leaderboard_rankings_total_volume
  ON leaderboard_rankings(total_volume_rank);

-- Function to refresh (call via cron or after workout)
CREATE OR REPLACE FUNCTION refresh_leaderboard_rankings()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_rankings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Setup Cron Job (via Supabase pg_cron):**

```sql
-- Refresh every 5 minutes
SELECT cron.schedule(
  'refresh-leaderboard',
  '*/5 * * * *',
  'SELECT refresh_leaderboard_rankings()'
);
```

**Dependencies:** None

**Effort:** M (2-4 hours)

**Risk if Unfixed:** Leaderboard queries will be slow at scale; multiple queries needed per request.

---

### 6.3 Enable Commented-Out Provider Contexts

**Description:** Analytics, Schedule, BodyMetrics, and Leaderboard providers are commented out in _layout.tsx.

**Files Affected:**
- `app/_layout.tsx`

**Exact Fix:**

```typescript
// app/_layout.tsx - Uncomment providers when features are ready

// After Phase 6.1 and 6.2 are complete:
<ProgrammeProvider>
  <AnalyticsProvider>      {/* Uncomment */}
    <ScheduleProvider>      {/* Uncomment */}
      <BodyMetricsProvider>  {/* Uncomment */}
        <LeaderboardProvider> {/* Uncomment */}
          <GestureHandlerRootView>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </LeaderboardProvider>
      </BodyMetricsProvider>
    </ScheduleProvider>
  </AnalyticsProvider>
</ProgrammeProvider>
```

**Dependencies:** 6.1, 6.2 (database changes should be in place first)

**Effort:** S (30 minutes, but only after dependencies)

**Risk if Unfixed:** Features remain inaccessible; users can't use Analytics or Leaderboard.

---

## SUMMARY

### Effort Breakdown

| Phase | Items | Total Effort |
|-------|-------|--------------|
| Phase 0 | 3 | ~2-3 hours |
| Phase 1 | 3 | ~3-4 hours |
| Phase 2 | 3 | ~4-5 hours |
| Phase 3 | 5 | ~1-2 days |
| Phase 4 | 4 | ~2-3 days |
| Phase 5 | 3 | ~3-4 hours |
| Phase 6 | 3 | ~1-2 days |

### Recommended Order

1. **Day 1:** Complete Phase 0 (critical blockers)
2. **Day 1-2:** Complete Phase 1 (security) + Phase 2 (stability)
3. **Day 2-3:** Complete Phase 3 (performance quick wins: 3.1-3.4)
4. **Day 3-4:** Phase 5 (infrastructure) + Phase 4 quick wins (4.1, 4.2)
5. **Week 2:** Phase 3.5 (analytics SQL) + Phase 4 tests
6. **Before feature launch:** Phase 6 (analytics/leaderboard prep)

### Critical Path

```
0.2 (tunnel mode)
    ↓
0.3 (programme saving) ← HIGHEST PRIORITY
    ↓
1.1 (RLS audit)
    ↓
3.1-3.4 (quick performance wins)
    ↓
5.1-5.2 (production readiness)
    ↓
LAUNCH
```
