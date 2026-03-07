# P1-001: Audit and Fix RLS Policies

**Priority:** HIGH
**Effort:** M (3-4 hours)
**Risk if Unfixed:** Data leakage between PTs, clients accessing unauthorized data

---

## Problem

Row Level Security (RLS) policies need comprehensive audit to ensure:
1. PTs can only see their own clients' data
2. Clients can only see their own data
3. PT-to-client relationships are properly enforced
4. Data sharing preferences (`client_progress_sharing`) are respected

---

## Root Cause Analysis

The audit identified **45+ RLS policies across 15 tables**. Most are correctly implemented for the PT/client model, but **2 security gaps** were found:

### Gap 1: `body_metrics` Missing Progress Sharing Check

**Current Policy:**
```sql
CREATE POLICY "PTs can view client body metrics"
ON body_metrics FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM pt_client_relationships
    WHERE pt_id = auth.uid()
    AND client_id = body_metrics.user_id
    AND status = 'active'
  )
);
```

**Issue:** PT can see body metrics even if client has `client_progress_sharing = false`.

### Gap 2: `personal_records` Missing Progress Sharing Check

**Same issue as body_metrics** - PTs can view PRs regardless of client's sharing preference.

---

## Complete RLS Policy Inventory

### Table: `profiles` (6 policies)

| Policy | Operation | Status | Notes |
|--------|-----------|--------|-------|
| Users can view own profile | SELECT | ✅ OK | `auth.uid() = id` |
| Users can update own profile | UPDATE | ✅ OK | `auth.uid() = id` |
| Users can insert own profile | INSERT | ✅ OK | `auth.uid() = id` |
| PTs can view client profiles | SELECT | ✅ OK | Checks relationship |
| Service role full access | ALL | ✅ OK | Backend only |

### Table: `pt_client_relationships` (5 policies)

| Policy | Operation | Status | Notes |
|--------|-----------|--------|-------|
| PTs can view own relationships | SELECT | ✅ OK | `pt_id = auth.uid()` |
| Clients can view own relationships | SELECT | ✅ OK | `client_id = auth.uid()` |
| PTs can create relationships | INSERT | ✅ OK | `pt_id = auth.uid()` |
| PTs can update own relationships | UPDATE | ✅ OK | `pt_id = auth.uid()` |
| Clients can update own relationships | UPDATE | ✅ OK | `client_id = auth.uid()` |

### Table: `programmes` (4 policies)

| Policy | Operation | Status | Notes |
|--------|-----------|--------|-------|
| Users can view own programmes | SELECT | ✅ OK | `user_id = auth.uid()` |
| Users can insert own programmes | INSERT | ✅ OK | `user_id = auth.uid()` |
| Users can update own programmes | UPDATE | ✅ OK | `user_id = auth.uid()` |
| Users can delete own programmes | DELETE | ✅ OK | `user_id = auth.uid()` |

### Table: `workout_days` (4 policies)

| Policy | Operation | Status | Notes |
|--------|-----------|--------|-------|
| Users can view own workout days | SELECT | ✅ OK | Via programme ownership |
| Users can insert own workout days | INSERT | ✅ OK | Via programme ownership |
| Users can update own workout days | UPDATE | ✅ OK | Via programme ownership |
| Users can delete own workout days | DELETE | ✅ OK | Via programme ownership |

### Table: `workout_day_exercises` (4 policies)

| Policy | Operation | Status | Notes |
|--------|-----------|--------|-------|
| Users can view own exercises | SELECT | ✅ OK | Via workout_day ownership |
| Users can insert own exercises | INSERT | ✅ OK | Via workout_day ownership |
| Users can update own exercises | UPDATE | ✅ OK | Via workout_day ownership |
| Users can delete own exercises | DELETE | ✅ OK | Via workout_day ownership |

### Table: `exercises` (2 policies)

| Policy | Operation | Status | Notes |
|--------|-----------|--------|-------|
| Anyone can view exercises | SELECT | ✅ OK | Public reference data |
| Admins can manage exercises | ALL | ✅ OK | Admin only |

### Table: `workout_sessions` (5 policies)

| Policy | Operation | Status | Notes |
|--------|-----------|--------|-------|
| Users can view own sessions | SELECT | ✅ OK | `user_id = auth.uid()` |
| Users can insert own sessions | INSERT | ✅ OK | `user_id = auth.uid()` |
| Users can update own sessions | UPDATE | ✅ OK | `user_id = auth.uid()` |
| PTs can view client sessions | SELECT | ✅ OK | Checks relationship + sharing |
| Service role full access | ALL | ✅ OK | Backend only |

### Table: `set_logs` (4 policies)

| Policy | Operation | Status | Notes |
|--------|-----------|--------|-------|
| Users can view own set logs | SELECT | ✅ OK | Via session ownership |
| Users can insert own set logs | INSERT | ✅ OK | Via session ownership |
| Users can update own set logs | UPDATE | ✅ OK | Via session ownership |
| Users can delete own set logs | DELETE | ✅ OK | Via session ownership |

### Table: `body_metrics` (4 policies)

| Policy | Operation | Status | Notes |
|--------|-----------|--------|-------|
| Users can view own metrics | SELECT | ✅ OK | `user_id = auth.uid()` |
| Users can insert own metrics | INSERT | ✅ OK | `user_id = auth.uid()` |
| Users can update own metrics | UPDATE | ✅ OK | `user_id = auth.uid()` |
| PTs can view client metrics | SELECT | ⚠️ **FIX** | Missing sharing check |

### Table: `personal_records` (4 policies)

| Policy | Operation | Status | Notes |
|--------|-----------|--------|-------|
| Users can view own PRs | SELECT | ✅ OK | `user_id = auth.uid()` |
| Users can insert own PRs | INSERT | ✅ OK | `user_id = auth.uid()` |
| PTs can view client PRs | SELECT | ⚠️ **FIX** | Missing sharing check |
| Service role full access | ALL | ✅ OK | Backend only |

### Table: `analytics_summary` (2 policies)

| Policy | Operation | Status | Notes |
|--------|-----------|--------|-------|
| Users can view own analytics | SELECT | ✅ OK | `user_id = auth.uid()` |
| Service role full access | ALL | ✅ OK | Backend only |

---

## Solution

### Fix 1: Update `body_metrics` PT Policy

**Migration:** `supabase/migrations/YYYYMMDDHHMMSS_fix_body_metrics_rls.sql`

```sql
-- Drop existing policy
DROP POLICY IF EXISTS "PTs can view client body metrics" ON body_metrics;

-- Create corrected policy with sharing check
CREATE POLICY "PTs can view client body metrics"
ON body_metrics FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM pt_client_relationships pcr
    JOIN profiles p ON p.id = pcr.client_id
    WHERE pcr.pt_id = auth.uid()
    AND pcr.client_id = body_metrics.user_id
    AND pcr.status = 'active'
    AND p.client_progress_sharing = true
  )
);
```

### Fix 2: Update `personal_records` PT Policy

**Migration:** `supabase/migrations/YYYYMMDDHHMMSS_fix_personal_records_rls.sql`

```sql
-- Drop existing policy
DROP POLICY IF EXISTS "PTs can view client personal records" ON personal_records;

-- Create corrected policy with sharing check
CREATE POLICY "PTs can view client personal records"
ON personal_records FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM pt_client_relationships pcr
    JOIN profiles p ON p.id = pcr.client_id
    WHERE pcr.pt_id = auth.uid()
    AND pcr.client_id = personal_records.user_id
    AND pcr.status = 'active'
    AND p.client_progress_sharing = true
  )
);
```

### Combined Migration File

**File:** `supabase/migrations/20260202120000_fix_rls_sharing_check.sql`

```sql
-- Fix RLS policies to respect client_progress_sharing preference
-- Ticket: P1-001

BEGIN;

-- Fix body_metrics
DROP POLICY IF EXISTS "PTs can view client body metrics" ON body_metrics;

CREATE POLICY "PTs can view client body metrics"
ON body_metrics FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM pt_client_relationships pcr
    JOIN profiles p ON p.id = pcr.client_id
    WHERE pcr.pt_id = auth.uid()
    AND pcr.client_id = body_metrics.user_id
    AND pcr.status = 'active'
    AND p.client_progress_sharing = true
  )
);

-- Fix personal_records
DROP POLICY IF EXISTS "PTs can view client personal records" ON personal_records;

CREATE POLICY "PTs can view client personal records"
ON personal_records FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM pt_client_relationships pcr
    JOIN profiles p ON p.id = pcr.client_id
    WHERE pcr.pt_id = auth.uid()
    AND pcr.client_id = personal_records.user_id
    AND pcr.status = 'active'
    AND p.client_progress_sharing = true
  )
);

COMMIT;
```

---

## Files to Modify

| File | Action |
|------|--------|
| `supabase/migrations/20260202120000_fix_rls_sharing_check.sql` | CREATE |

---

## Database Changes

### Migration

Apply the migration above via:

```bash
supabase db push
# or
supabase migration up
```

### Rollback SQL

```sql
-- Rollback: Remove sharing check (restores original behavior)
BEGIN;

DROP POLICY IF EXISTS "PTs can view client body metrics" ON body_metrics;
CREATE POLICY "PTs can view client body metrics"
ON body_metrics FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM pt_client_relationships
    WHERE pt_id = auth.uid()
    AND client_id = body_metrics.user_id
    AND status = 'active'
  )
);

DROP POLICY IF EXISTS "PTs can view client personal records" ON personal_records;
CREATE POLICY "PTs can view client personal records"
ON personal_records FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM pt_client_relationships
    WHERE pt_id = auth.uid()
    AND client_id = personal_records.user_id
    AND status = 'active'
  )
);

COMMIT;
```

---

## Testing

### Test Case 1: Client with Sharing Enabled

1. Create client user with `client_progress_sharing = true`
2. Create PT user
3. Create active relationship
4. Add body metric for client
5. Query as PT → Should see metric

```sql
-- As PT user
SELECT * FROM body_metrics WHERE user_id = '<client_id>';
-- Expected: Returns client's metrics
```

### Test Case 2: Client with Sharing Disabled

1. Create client user with `client_progress_sharing = false`
2. Create PT user
3. Create active relationship
4. Add body metric for client
5. Query as PT → Should NOT see metric

```sql
-- As PT user
SELECT * FROM body_metrics WHERE user_id = '<client_id>';
-- Expected: Returns empty (0 rows)
```

### Test Case 3: No Relationship

1. Create client user
2. Create PT user (no relationship)
3. Add body metric for client
4. Query as PT → Should NOT see metric

### Test Case 4: User Sees Own Data

1. Create user
2. Add body metric
3. Query as same user → Should see metric

---

## Rollback

1. **Immediate rollback:** Run the rollback SQL above
2. **Git revert:** `git revert <migration-commit>`
3. **Supabase rollback:** Use Supabase dashboard to manually edit policies

---

## Verification Checklist

- [ ] Review all 45+ policies in Supabase dashboard
- [ ] Create migration file
- [ ] Test locally with `supabase db reset`
- [ ] Test case 1: Sharing enabled - PT can see data
- [ ] Test case 2: Sharing disabled - PT cannot see data
- [ ] Test case 3: No relationship - PT cannot see data
- [ ] Test case 4: User sees own data
- [ ] Deploy migration to staging
- [ ] Verify in staging environment
- [ ] Deploy to production
- [ ] Commit with message: "fix(security): add client_progress_sharing check to RLS policies"
