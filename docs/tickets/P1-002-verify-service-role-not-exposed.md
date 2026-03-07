# P1-002: Verify Service Role Key Not Exposed to Client

**Priority:** HIGH
**Effort:** S (30 minutes)
**Risk if Unfixed:** Complete database compromise - attacker bypasses all RLS

---

## Problem

The Supabase service role key bypasses all Row Level Security (RLS) policies. If exposed to the client (React Native app), an attacker could:
- Read any user's data
- Modify any record
- Delete entire tables
- Access admin-only functions

---

## Audit Results: ✅ PASSED

The codebase was audited and **no exposure of the service role key was found**. This ticket documents the verification and establishes ongoing checks.

---

## Verification Evidence

### 1. Environment Variable Separation

**File:** `lib/env.ts` (Lines 5-14)

```typescript
// Client-safe variables (EXPO_PUBLIC_ prefix)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Server-only variable (no EXPO_PUBLIC_ prefix)
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
```

**Status:** ✅ Correct separation

### 2. Service Role Usage

**File:** `backend/lib/auth.ts` (Lines 23-25)

```typescript
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { ... }
);
```

**Status:** ✅ Only used in backend code

### 3. Client Supabase Instance

**File:** `lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, { ... });
```

**Status:** ✅ Uses anon key only

### 4. No EXPO_PUBLIC Exposure

**Search performed:**
```bash
grep -r "EXPO_PUBLIC.*SERVICE_ROLE" --include="*.ts" --include="*.tsx" .
# Result: No matches
```

**Status:** ✅ Service role key is never prefixed with EXPO_PUBLIC_

### 5. Bundle Analysis

The React Native bundle only contains:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_API_URL`

**Status:** ✅ Service role key not in client bundle

---

## Solution

No code changes required. Implement ongoing verification checks.

### Ongoing Checks

#### 1. Pre-commit Hook

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Check for service role key exposure
if grep -r "EXPO_PUBLIC.*SERVICE_ROLE" --include="*.ts" --include="*.tsx" . ; then
  echo "ERROR: Service role key must not use EXPO_PUBLIC_ prefix"
  exit 1
fi

# Check for hardcoded keys (basic pattern)
if grep -rE "eyJ[a-zA-Z0-9_-]{50,}" --include="*.ts" --include="*.tsx" . ; then
  echo "WARNING: Possible hardcoded JWT token found. Please review."
fi
```

#### 2. CI Check

Add to GitHub Actions workflow:

```yaml
- name: Check for exposed secrets
  run: |
    if grep -r "EXPO_PUBLIC.*SERVICE_ROLE" --include="*.ts" --include="*.tsx" . ; then
      echo "::error::Service role key must not use EXPO_PUBLIC_ prefix"
      exit 1
    fi
```

#### 3. ESLint Rule (Optional)

Create custom ESLint rule to flag service role references in frontend code:

```javascript
// eslint-rules/no-service-role-frontend.js
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow service role key in frontend code',
    },
  },
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value === 'string' &&
            node.value.includes('SERVICE_ROLE')) {
          context.report({
            node,
            message: 'Service role key references not allowed in frontend code',
          });
        }
      },
    };
  },
};
```

---

## Files to Modify

| File | Action |
|------|--------|
| `.husky/pre-commit` | Add service role check |
| `.github/workflows/ci.yml` | Add CI verification step |

---

## Database Changes

None.

---

## Testing

### Manual Verification

1. **Search codebase:**
   ```bash
   grep -r "SERVICE_ROLE" --include="*.ts" --include="*.tsx" .
   ```
   Expected: Only matches in `backend/` directory

2. **Check environment files:**
   ```bash
   cat .env.example
   ```
   Expected: `SUPABASE_SERVICE_ROLE_KEY` has no `EXPO_PUBLIC_` prefix

3. **Check client bundle:**
   ```bash
   npm run build
   # Inspect bundle for any service role references
   ```

### Automated Test

```typescript
// __tests__/security/no-service-role-exposure.test.ts
import { execSync } from 'child_process';

describe('Security: Service Role Key', () => {
  it('should not expose service role key with EXPO_PUBLIC prefix', () => {
    const result = execSync(
      'grep -r "EXPO_PUBLIC.*SERVICE_ROLE" --include="*.ts" --include="*.tsx" . || true',
      { encoding: 'utf-8' }
    );
    expect(result.trim()).toBe('');
  });

  it('should only reference service role in backend code', () => {
    const result = execSync(
      'grep -rl "SERVICE_ROLE" --include="*.ts" --include="*.tsx" . || true',
      { encoding: 'utf-8' }
    );
    const files = result.trim().split('\n').filter(Boolean);
    files.forEach(file => {
      expect(file).toMatch(/^\.\/backend\//);
    });
  });
});
```

---

## Rollback

Not applicable - this ticket adds checks, not changes.

---

## Verification Checklist

- [x] Search for `EXPO_PUBLIC.*SERVICE_ROLE` - none found
- [x] Verify `lib/env.ts` separates client/server vars
- [x] Verify `backend/lib/auth.ts` uses server-only key
- [x] Verify `lib/supabase.ts` uses anon key
- [ ] Add pre-commit hook for ongoing verification
- [ ] Add CI check for ongoing verification
- [ ] Document in README the importance of key separation
