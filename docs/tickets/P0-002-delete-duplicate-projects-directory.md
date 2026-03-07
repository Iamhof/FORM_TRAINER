# P0-002: Delete Duplicate Projects Directory

**Priority:** CRITICAL
**Effort:** S (15 minutes)
**Risk if Unfixed:** Developers edit wrong files, changes get lost, merge conflicts

---

## Problem

There is a `projects/` directory at the repository root that contains **38 duplicate files** that mirror files in the actual source directories (`app/`, `components/`, `lib/`, etc.). This causes:

1. Confusion about which file to edit
2. Changes made to wrong file get lost
3. IDE search returns duplicate results
4. Potential for code divergence between copies

---

## Root Cause

The `projects/` directory appears to be an accidental copy or failed refactor artifact. It was likely:
- Created during a project restructure that was abandoned
- A backup copy that was accidentally committed
- An export from a different tool

---

## Solution

Delete the entire `projects/` directory.

```bash
rm -rf projects/
```

### Pre-deletion Verification

Before deleting, verify these files are exact duplicates:

```bash
# Check if any files in projects/ are different from their source
diff -rq projects/components components/ 2>/dev/null || echo "Differences found"
diff -rq projects/lib lib/ 2>/dev/null || echo "Differences found"
diff -rq projects/app app/ 2>/dev/null || echo "Differences found"
```

If differences exist, manually review before deleting.

---

## Files to Modify

| Action | Path |
|--------|------|
| DELETE | `projects/` (entire directory, ~38 files) |

### Files Being Deleted

Based on the audit, the `projects/` directory contains duplicates of:
- Component files
- Library files
- App route files
- Configuration files

---

## Database Changes

None.

---

## Testing

1. **Pre-deletion:**
   ```bash
   # Verify build still works without projects/
   npm run build
   npm run typecheck
   npm run lint
   ```

2. **Post-deletion:**
   ```bash
   # Same checks should pass
   npm run build
   npm run typecheck
   npm run lint
   ```

3. **Search verification:**
   ```bash
   # Ensure no imports reference projects/
   grep -r "from ['\"].*projects/" --include="*.ts" --include="*.tsx" .
   ```

---

## Rollback

If the directory contained unique files that were needed:

```bash
# Restore from git
git checkout HEAD~1 -- projects/
```

Or restore from git history:

```bash
git log --all --full-history -- projects/
git checkout <commit-hash> -- projects/
```

---

## Verification Checklist

- [ ] Run `diff` to confirm files are duplicates
- [ ] Check no imports reference `projects/`
- [ ] Delete directory
- [ ] Run `npm run build` - should pass
- [ ] Run `npm run typecheck` - should pass
- [ ] Run `npm run lint` - should pass
- [ ] Commit with message: "chore: remove duplicate projects directory"
- [ ] Verify IDE search no longer shows duplicates
