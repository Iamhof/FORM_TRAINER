# App Crash Diagnostic Guide

## Quick Checks

### 1. Check Terminal Logs
Look at the terminal where Expo is running. Look for:
- Red error messages
- Stack traces
- `[ErrorBoundary]` messages
- `[UserContext]` initialization errors
- `[ConnectionTest]` errors

### 2. Check Expo Go Logs
In Expo Go app:
- Shake your device to open developer menu
- Tap "Show Element Inspector" or "Debug Remote JS"
- Check for error messages

### 3. Common Crash Causes

#### A. Supabase Connection Failure
**Symptom**: App crashes immediately on startup
**Check**: Look for `[ConnectionTest]` errors in terminal
**Fix**: Verify `.env` file has correct Supabase credentials

#### B. RLS Policy Issue (After Migration)
**Symptom**: Connection test fails
**Check**: The migration might have broken RLS policies
**Fix**: Check if `profiles` table is accessible

#### C. Environment Variables Missing
**Symptom**: `Environment validation failed` error
**Check**: Verify `.env` file exists and has all required variables
**Fix**: Ensure `.env` is in `rork-OJ-form-main/` directory

#### D. Tunnel Mode API Issues
**Symptom**: TRPC errors, backend not reachable
**Check**: Look for `[TRPC] TUNNEL MODE DETECTED` warnings
**Fix**: Try running without tunnel: `expo start` (not `--tunnel`)

## Diagnostic Steps

1. **Check if Supabase connection works:**
   - Go to Supabase Dashboard
   - Try querying `profiles` table manually
   - Verify RLS policies are correct

2. **Check environment variables:**
   ```powershell
   cd "C:\My Apps\FORM_APP\rork-OJ-form-main"
   # Check if .env exists
   Test-Path .env
   ```

3. **Try running without tunnel:**
   ```powershell
   cd "C:\My Apps\FORM_APP\rork-OJ-form-main"
   # Stop current server (Ctrl+C)
   expo start
   # (without --tunnel flag)
   ```

4. **Check for syntax errors:**
   ```powershell
   cd "C:\My Apps\FORM_APP\rork-OJ-form-main"
   bun run typecheck
   ```

## What to Share for Debugging

1. **Terminal output** - Copy any error messages
2. **Expo Go error screen** - Screenshot if available
3. **Error message** - Exact text of any error
4. **When it crashes** - Immediately on open? After login screen?
