# P0-001: Fix Programme Saving Flow

**Priority:** CRITICAL
**Effort:** M (4-6 hours)
**Risk if Unfixed:** App is unusable - users cannot save workout programmes

---

## Problem

When users complete the programme creation wizard and tap "Save Programme", nothing happens. No error message, no success feedback, no navigation. The programme is not saved to the database.

---

## Root Cause Analysis

The programme save flow passes through 5 files, with **10 critical failure points** identified:

### Complete Flow Trace

```
User taps "Save Programme"
    ↓
app/create-programme/review.tsx (handleSave)
    ↓
contexts/ProgrammeContext.tsx (addProgramme)
    ↓
lib/trpc.ts (mutation via httpLink with custom fetch)
    ↓
backend/trpc/create-context.ts (auth context creation)
    ↓
backend/trpc/routes/programmes/create/route.ts (database insert)
```

### Failure Point #1: Missing Loading State
**File:** `app/create-programme/review.tsx`
**Lines:** 34-81

```typescript
const handleSave = async () => {
  // NO loading state - user can tap multiple times
  // NO try/catch - errors are swallowed
  try {
    await addProgramme(programme);
    router.replace('/(tabs)/programmes');
  } catch (error) {
    // Error is caught but only logged, no user feedback
    console.error('Failed to save programme:', error);
  }
};
```

**Issue:** No loading indicator, no error Alert, user gets no feedback on failure.

### Failure Point #2: Silent Auth Failure in tRPC Headers
**File:** `lib/trpc.ts`
**Lines:** 160-164

```typescript
const { data: { session }, error: sessionError } = await supabase.auth.getSession();
if (sessionError || !session) {
  // SILENT FAILURE: Returns empty object, request proceeds unauthenticated
  return {};
}
```

**Issue:** If `getSession()` fails, the request continues without auth headers. The backend receives no token, creates no user context, and the `protectedProcedure` rejects with UNAUTHORIZED - but the error message is generic.

### Failure Point #3: Silent Auth Resolution
**File:** `backend/trpc/create-context.ts`
**Lines:** 17-18

```typescript
} catch (error) {
  return null; // Silent failure, no logging
}
```

**Issue:** If JWT validation fails, returns `null` silently. No logging, no way to debug auth issues.

### Failure Point #4: Fragile Tunnel Detection
**File:** `contexts/ProgrammeContext.tsx`
**Lines:** 163-197

```typescript
if (error instanceof Error && error.message.includes('Failed to fetch')) {
  // Assumes network error means tunnel mode needed
  // But could be many other causes
}
```

**Issue:** Tunnel fallback logic relies on error message string matching. This is fragile and may trigger incorrectly.

### Failure Point #5: No Pre-flight Auth Check
**File:** `contexts/ProgrammeContext.tsx`
**Line:** 151

```typescript
if (!user) {
  throw new Error('Not authenticated');
}
```

**Issue:** Checks local `user` state, but `user` can be stale. Should check `supabase.auth.getSession()` for current state.

### Failure Point #6: Duplicate Name Race Condition
**File:** `backend/trpc/routes/programmes/create/route.ts`
**Lines:** 28-33

```typescript
const { data: existingProgramme } = await supabaseAdmin
  .from('programmes')
  .select('id')
  .eq('name', input.name)
  .eq('user_id', userId)
  .single();
```

**Issue:** Check-then-insert is not atomic. Two simultaneous requests could both pass the check.

### Failure Point #7: Generic Error Messages
**File:** `backend/trpc/routes/programmes/create/route.ts`
**Lines:** 54-59

```typescript
if (error || !programme) {
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Failed to create programme', // Generic, unhelpful
  });
}
```

**Issue:** All errors get the same message. User and developer cannot distinguish between auth failure, validation failure, or database error.

### Failure Point #8: Missing Transaction
**File:** `backend/trpc/routes/programmes/create/route.ts`
**Lines:** 42-52

```typescript
const { data: programme, error } = await supabaseAdmin
  .from('programmes')
  .insert({ ... })
  .select()
  .single();
```

**Issue:** Single insert is fine, but if future logic adds workout_days in same operation, needs transaction.

### Failure Point #9: No Request Logging
**File:** `backend/trpc/routes/programmes/create/route.ts`

**Issue:** No logging of incoming requests, successful creates, or detailed error info. Impossible to debug production issues.

### Failure Point #10: HTML Response Detection Masks Real Errors
**File:** `lib/trpc.ts`
**Lines:** 269-283

```typescript
if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
  throw new Error('Server returned HTML instead of JSON (likely a server error page)');
}
```

**Issue:** When Vercel returns an error page, the real error is lost. The HTML often contains the actual error message.

---

## Solution

### Fix 1: Add Loading State and Error Alert to review.tsx

**File:** `app/create-programme/review.tsx`

```typescript
import { useState } from 'react';
import { Alert } from 'react-native';

// Inside component:
const [isSaving, setIsSaving] = useState(false);

const handleSave = async () => {
  if (isSaving) return; // Prevent double-tap

  setIsSaving(true);
  try {
    await addProgramme(programme);
    router.replace('/(tabs)/programmes');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    Alert.alert(
      'Failed to Save',
      `Could not save your programme: ${message}`,
      [{ text: 'OK' }]
    );
  } finally {
    setIsSaving(false);
  }
};

// In the save button:
<Button
  onPress={handleSave}
  disabled={isSaving}
  loading={isSaving}
>
  {isSaving ? 'Saving...' : 'Save Programme'}
</Button>
```

### Fix 2: Add Auth Error Logging in tRPC Client

**File:** `lib/trpc.ts`

```typescript
// Lines 160-164, replace with:
const { data: { session }, error: sessionError } = await supabase.auth.getSession();
if (sessionError) {
  console.error('[tRPC] Failed to get auth session:', sessionError.message);
  // Still return empty - let backend handle UNAUTHORIZED
  return {};
}
if (!session) {
  console.warn('[tRPC] No active session, request will be unauthenticated');
  return {};
}
```

### Fix 3: Add Logging to Backend Auth Resolution

**File:** `backend/trpc/create-context.ts`

```typescript
import { logger } from '@/lib/logger';

async function resolveUserFromToken(token: string): Promise<string | null> {
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error) {
      logger.warn('Auth token validation failed:', { error: error.message });
      return null;
    }
    if (!user) {
      logger.warn('Auth token valid but no user returned');
      return null;
    }
    return user.id;
  } catch (error) {
    logger.error('Unexpected error resolving user from token:', error);
    return null;
  }
}
```

### Fix 4: Add Request Logging to Programme Create Route

**File:** `backend/trpc/routes/programmes/create/route.ts`

```typescript
import { logger } from '@/lib/logger';

// At start of mutation:
logger.info('Programme create request', {
  userId,
  programmeName: input.name,
  daysCount: input.days?.length
});

// On success:
logger.info('Programme created successfully', {
  programmeId: programme.id,
  userId
});

// On error:
logger.error('Programme creation failed', {
  userId,
  error: error?.message,
  code: error?.code
});
```

### Fix 5: Improve Error Messages

**File:** `backend/trpc/routes/programmes/create/route.ts`

```typescript
// Replace generic error with specific ones:
if (error) {
  logger.error('Database error creating programme', { error });

  if (error.code === '23505') { // Unique violation
    throw new TRPCError({
      code: 'CONFLICT',
      message: 'A programme with this name already exists',
    });
  }

  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: `Database error: ${error.message}`,
  });
}

if (!programme) {
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Programme was not returned after insert',
  });
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `app/create-programme/review.tsx` | Add loading state, error Alert, disable button while saving |
| `lib/trpc.ts` | Add console.error/warn for auth failures |
| `backend/trpc/create-context.ts` | Add logger calls for auth resolution |
| `backend/trpc/routes/programmes/create/route.ts` | Add request/response logging, improve error messages |

---

## Database Changes

None required. The issue is in the application code, not the schema.

---

## Testing

### Manual Testing Steps

1. **Test successful save:**
   - Create a new programme with valid data
   - Tap Save
   - Verify loading state appears
   - Verify navigation to programmes list
   - Verify programme appears in list

2. **Test duplicate name:**
   - Create programme named "Test"
   - Try to create another named "Test"
   - Verify specific error message appears

3. **Test unauthenticated:**
   - Log out
   - Try to save (if UI allows)
   - Verify "Not authenticated" error

4. **Test network failure:**
   - Enable airplane mode
   - Try to save
   - Verify appropriate error message

### Automated Test

```typescript
// __tests__/create-programme.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useProgrammeContext } from '../contexts/ProgrammeContext';

describe('Programme Creation', () => {
  it('shows error when not authenticated', async () => {
    // Mock no user
    const { result } = renderHook(() => useProgrammeContext());

    await expect(
      act(() => result.current.addProgramme({ name: 'Test', days: [] }))
    ).rejects.toThrow('Not authenticated');
  });

  it('shows loading state while saving', async () => {
    // Test loading state management
  });
});
```

---

## Rollback

If issues occur after deployment:

1. **Immediate:** The changes are backwards-compatible. No rollback needed for functionality.
2. **If logging causes issues:** Remove logger calls but keep error handling improvements.
3. **Git revert:** `git revert <commit-hash>` for the specific commit.

---

## Verification Checklist

- [ ] Loading spinner appears when Save is tapped
- [ ] Button is disabled while saving
- [ ] Error Alert shows with specific message on failure
- [ ] Console logs show auth flow in development
- [ ] Backend logs show request/response in Vercel logs
- [ ] Duplicate name gives specific error message
- [ ] Successful save navigates to programmes list
- [ ] Programme appears in database after save
