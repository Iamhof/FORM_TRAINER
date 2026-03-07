# P0-003: Remove Tunnel Mode as Default

**Priority:** CRITICAL
**Effort:** S (15 minutes)
**Risk if Unfixed:** Slow development, unreliable connections, confusing errors

---

## Problem

The `package.json` dev script uses `--tunnel` flag by default:

```json
"dev": "EXPO_NO_DOTENV=1 npx expo start --tunnel"
```

This causes:
1. **Slow startup:** Tunnel takes 10-30 seconds to establish
2. **Unreliable connections:** Tunnel can drop or timeout
3. **Unnecessary complexity:** Most developers don't need tunnel for local development
4. **Confusing errors:** Network failures get misattributed to app bugs

---

## Root Cause

Tunnel mode was likely added as a workaround for:
- Firewall issues on a specific network
- Testing on physical devices without same-network access
- A one-time debugging session that became permanent

---

## Solution

Remove `--tunnel` from the default dev script and add it as a separate command for when it's needed.

### Before

```json
{
  "scripts": {
    "dev": "EXPO_NO_DOTENV=1 npx expo start --tunnel"
  }
}
```

### After

```json
{
  "scripts": {
    "dev": "EXPO_NO_DOTENV=1 npx expo start",
    "dev:tunnel": "EXPO_NO_DOTENV=1 npx expo start --tunnel"
  }
}
```

---

## Files to Modify

| File | Change |
|------|--------|
| `package.json` | Modify `dev` script, add `dev:tunnel` script |

### Exact Change

**File:** `package.json`

Find:
```json
"dev": "EXPO_NO_DOTENV=1 npx expo start --tunnel",
```

Replace with:
```json
"dev": "EXPO_NO_DOTENV=1 npx expo start",
"dev:tunnel": "EXPO_NO_DOTENV=1 npx expo start --tunnel",
```

---

## Database Changes

None.

---

## Testing

1. **Test local development:**
   ```bash
   npm run dev
   ```
   - Verify Expo starts without tunnel
   - Verify app loads on simulator/emulator
   - Verify hot reload works

2. **Test tunnel mode (if needed):**
   ```bash
   npm run dev:tunnel
   ```
   - Verify tunnel still works when explicitly requested

3. **Test on physical device (same network):**
   - Run `npm run dev`
   - Scan QR code with Expo Go
   - Verify connection works

---

## Rollback

If tunnel mode is actually required for the team:

```bash
git revert <commit-hash>
```

Or manually restore the original script:

```json
"dev": "EXPO_NO_DOTENV=1 npx expo start --tunnel"
```

---

## Additional Context

### When to Use Tunnel

Tunnel mode (`--tunnel`) is needed when:
- Physical device is on a different network than dev machine
- Corporate firewall blocks local network access
- Testing with external testers who can't access local network

### Alternatives to Tunnel

1. **LAN mode (default):** Works when device and computer are on same network
2. **Localhost mode:** `npx expo start --localhost` - only works with simulators
3. **Published builds:** For testing on devices without network access

---

## Verification Checklist

- [ ] Update `dev` script to remove `--tunnel`
- [ ] Add `dev:tunnel` script for when tunnel is needed
- [ ] Run `npm run dev` and verify faster startup
- [ ] Test app loads on simulator
- [ ] Test hot reload works
- [ ] Document in README when to use `dev:tunnel`
- [ ] Commit with message: "fix: remove tunnel mode as default, add dev:tunnel for explicit use"
