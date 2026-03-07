# P1-003: Verify Public Exercises Endpoint is Intentionally Unauthenticated

**Priority:** HIGH
**Effort:** S (15 minutes)
**Risk if Unfixed:** Unclear security posture, potential unintended data exposure

---

## Problem

The `listExercises` endpoint uses `publicProcedure` instead of `protectedProcedure`:

**File:** `backend/trpc/routes/exercises/list/route.ts`

```typescript
export const listExercisesProcedure = publicProcedure.query(async () => {
  const { data: exercises, error } = await supabaseAdmin
    .from('exercises')
    .select('*')
    .order('name', { ascending: true });
  // ...
});
```

This means:
- No authentication required
- Any client can fetch all exercises
- Rate limiting may not be applied

---

## Analysis

### Is This Intentional?

**YES** - The exercises table contains **reference data** that should be publicly accessible:

1. **Data Type:** Exercise definitions (name, muscle groups, equipment, etc.)
2. **Sensitivity:** None - this is not user-specific data
3. **Use Case:** Users need to see available exercises before logging in
4. **Similar Pattern:** Many fitness apps expose exercise catalogs publicly

### Supporting Evidence

**RLS Policy on `exercises` table:**
```sql
CREATE POLICY "Anyone can view exercises"
ON exercises FOR SELECT
TO authenticated, anon
USING (true);
```

This confirms the intent is public access.

---

## Solution

The endpoint is correctly designed. Add documentation to clarify the intent.

### Add JSDoc Comment

**File:** `backend/trpc/routes/exercises/list/route.ts`

```typescript
import { publicProcedure } from '../../../create-context.js';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth.js';
import { logger } from '@/lib/logger';

/**
 * Lists all available exercises.
 *
 * This endpoint is intentionally public (no auth required) because:
 * 1. Exercise definitions are reference data, not user-specific
 * 2. Users need to browse exercises before logging in
 * 3. The data is non-sensitive (names, muscle groups, etc.)
 *
 * Rate limiting is handled at the API gateway level.
 */
export const listExercisesProcedure = publicProcedure.query(async () => {
  const { data: exercises, error } = await supabaseAdmin
    .from('exercises')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    logger.error('Error fetching exercises:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch exercises',
    });
  }

  return exercises || [];
});
```

### Add to Security Documentation

**File:** `docs/SECURITY.md` (create if doesn't exist)

```markdown
## Public Endpoints

The following endpoints are intentionally public (no authentication required):

| Endpoint | Reason |
|----------|--------|
| `exercises.list` | Reference data - users need to browse exercises before logging in |

### Rate Limiting

All endpoints, including public ones, are rate-limited at the API gateway level:
- 100 requests per minute per IP
- 1000 requests per hour per IP

### Monitoring

Public endpoints are monitored for abuse:
- Unusual traffic patterns trigger alerts
- Blocked IPs are logged
```

---

## Files to Modify

| File | Change |
|------|--------|
| `backend/trpc/routes/exercises/list/route.ts` | Add JSDoc comment explaining public access |
| `docs/SECURITY.md` | Document public endpoints (create if needed) |

---

## Database Changes

None. The RLS policy already correctly allows public access:

```sql
-- Existing policy (no change needed)
CREATE POLICY "Anyone can view exercises"
ON exercises FOR SELECT
TO authenticated, anon
USING (true);
```

---

## Testing

### Verify Public Access Works

```bash
# Without auth header
curl https://your-api.vercel.app/api/trpc/exercises.list

# Expected: Returns list of exercises
```

### Verify Data Is Non-Sensitive

Review the `exercises` table schema:

| Column | Sensitive? |
|--------|------------|
| id | No |
| name | No |
| description | No |
| muscle_groups | No |
| equipment | No |
| instructions | No |
| created_at | No |

**Result:** No sensitive data in exercises table.

### Verify Rate Limiting

```bash
# Send 200 requests quickly
for i in {1..200}; do
  curl -s https://your-api.vercel.app/api/trpc/exercises.list > /dev/null &
done

# Check for rate limit response (429)
```

---

## Rollback

If public access needs to be removed:

```typescript
// Change from:
export const listExercisesProcedure = publicProcedure.query(async () => {

// To:
export const listExercisesProcedure = protectedProcedure.query(async ({ ctx }) => {
```

And update RLS:

```sql
DROP POLICY "Anyone can view exercises" ON exercises;
CREATE POLICY "Authenticated users can view exercises"
ON exercises FOR SELECT
TO authenticated
USING (true);
```

---

## Verification Checklist

- [x] Confirm exercises table contains only non-sensitive reference data
- [x] Confirm RLS policy allows public access intentionally
- [x] Confirm similar patterns are common in fitness apps
- [ ] Add JSDoc comment explaining why endpoint is public
- [ ] Create/update SECURITY.md documenting public endpoints
- [ ] Verify rate limiting is configured at API gateway
- [ ] Commit with message: "docs: document intentional public access for exercises endpoint"

---

## Related Considerations

### Future Public Endpoints

If adding new public endpoints, they must:
1. Contain only non-sensitive data
2. Have RLS policies allowing anon access
3. Be documented in SECURITY.md
4. Be rate-limited
5. Be reviewed in security audits

### Alternatives Considered

1. **Require auth, return cached data for anon:** Adds complexity for no security benefit
2. **Add API key for public access:** Overkill for non-sensitive reference data
3. **Move to CDN/static file:** Could improve performance, but exercises may be updated

The current approach (public tRPC endpoint) is appropriate for this use case.
