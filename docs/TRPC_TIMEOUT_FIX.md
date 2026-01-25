# TRPC Timeout Fix Documentation

## Issue #20: TRPC Client Timeout Too Short for Slow Networks

### Problem
The TRPC client had a fixed 30-second timeout for all requests. For users on slow networks (3G, poor WiFi), data-intensive operations like uploading workout data or syncing analytics could legitimately take longer than 30 seconds, resulting in:
- Failed requests and data loss
- Poor user experience in areas with bad connectivity
- No retry mechanism for transient failures

### Solution Implemented

#### 1. Increased Default Timeout
- **Previous**: 30 seconds (hardcoded)
- **New Default**: 60 seconds
- **Rationale**: Gives slow networks more time to complete operations

#### 2. Configurable Timeout System
Added timeout configuration with different presets:

```typescript
TIMEOUT_CONFIG = {
  DEFAULT: 60000,          // 60 seconds - general operations
  QUICK_OPERATION: 30000,  // 30 seconds - lightweight reads
  HEAVY_OPERATION: 90000,  // 90 seconds - workout uploads, analytics
  BATCH_OPERATION: 120000, // 2 minutes - batch operations
}
```

#### 3. Environment Variable Override
Added `EXPO_PUBLIC_TRPC_TIMEOUT` environment variable to allow custom timeout configuration:

```bash
# In .env file
EXPO_PUBLIC_TRPC_TIMEOUT=90000  # 90 seconds
```

#### 4. Retry Configuration Helpers
Added `getRetryConfig()` helper for React Query/TRPC mutations:

```typescript
// Quick operations (1 retry, max 5s delay)
getRetryConfig('quick')

// Default operations (2 retries, max 10s delay)
getRetryConfig('default')

// Heavy operations (3 retries, max 15s delay)
getRetryConfig('heavy')
```

Uses exponential backoff: `Math.min(1000 * 2^attemptIndex, maxDelay)`

---

## How to Use

### Automatic Benefits
All TRPC requests now automatically benefit from the increased 60-second default timeout. No code changes required.

### For Heavy Operations (Recommended)
For operations that upload/sync large amounts of data, add retry configuration:

#### Example 1: Analytics Sync
```typescript
// contexts/AnalyticsContext.tsx
import { trpc, getRetryConfig } from '@/lib/trpc';

const syncMutation = trpc.analytics.sync.useMutation({
  ...getRetryConfig('heavy'), // Adds 3 retries with exponential backoff
  onSuccess: () => {
    overviewQuery.refetch();
    volumeQuery.refetch();
  },
});
```

#### Example 2: Workout Upload
```typescript
// app/session/[id].tsx
import { trpc, getRetryConfig } from '@/lib/trpc';

const saveWorkout = trpc.workouts.create.useMutation({
  ...getRetryConfig('heavy'),
  onSuccess: () => {
    // Success handler
  },
  onError: (error) => {
    if (isTimeoutError(error)) {
      Alert.alert(
        'Slow Connection',
        'Your workout is being saved but may take longer on slow networks.'
      );
    }
  },
});
```

#### Example 3: Quick Operations
```typescript
// For lightweight operations that don't need heavy retry logic
const getUserProfile = trpc.user.getProfile.useQuery(undefined, {
  ...getRetryConfig('quick'),
});
```

---

## Testing on Slow Networks

### Chrome DevTools (Web)
1. Open DevTools → Network tab
2. Throttle to "Slow 3G" or "Fast 3G"
3. Test workout completion and analytics sync

### iOS Simulator
1. Settings → Developer → Network Link Conditioner
2. Enable "Very Bad Network" or "3G"
3. Test the app

### Android Emulator
```bash
adb shell
# Set network delay to 500ms
su
iptables -A OUTPUT -p tcp --dport 80 -j DELAY --delay 500
```

Or use Android Studio's Network Profiler.

---

## Benefits

### Before Fix
- ❌ 30-second timeout for ALL operations
- ❌ No retry logic
- ❌ Data loss on slow networks
- ❌ Poor error messages
- ❌ No configuration options

### After Fix
- ✅ 60-second default timeout (2x improvement)
- ✅ 90 seconds for heavy operations
- ✅ Automatic retries with exponential backoff
- ✅ Configurable via environment variable
- ✅ Better error messages with timeout duration
- ✅ Operation-specific timeout support

---

## Edge Cases Handled

1. **Very Slow Networks**: 90-second timeout for heavy operations gives enough time
2. **Intermittent Failures**: Retry logic handles transient network issues
3. **Custom Requirements**: Environment variable allows per-deployment configuration
4. **Error Detection**: `isTimeoutError()` helper for timeout-specific error handling

---

## Future Enhancements (Optional)

If timeout issues persist, consider:

1. **Network Quality Detection**: Automatically adjust timeouts based on detected network speed
2. **Progressive Uploads**: Break large payloads into smaller chunks
3. **Offline Queue**: Queue operations when offline, sync when back online
4. **Request Compression**: Reduce payload size to speed up transfers

---

## Migration Guide

### Existing Code (No Changes Required)
All existing TRPC calls automatically get the 60-second timeout. No migration needed.

### Recommended Updates
Add retry configuration to these heavy operations:

1. ✅ **Analytics Sync** - `contexts/AnalyticsContext.tsx` line 79
2. ✅ **Workout Completion** - Check `app/session/[id].tsx` for workout save operations
3. ✅ **Programme Creation** - If creating programmes with many exercises
4. ✅ **Bulk Exercise Uploads** - Any bulk data operations

### Example Migration
```typescript
// BEFORE
const mutation = trpc.heavyOperation.useMutation({
  onSuccess: handleSuccess,
});

// AFTER
import { getRetryConfig } from '@/lib/trpc';

const mutation = trpc.heavyOperation.useMutation({
  ...getRetryConfig('heavy'), // Add this line
  onSuccess: handleSuccess,
});
```

---

## Files Changed

1. **lib/trpc.ts**
   - Added `TIMEOUT_CONFIG` constants
   - Increased default timeout from 30s to 60s
   - Added `getDefaultTimeout()` for env variable support
   - Updated custom fetch to support per-request timeout hints
   - Added `getRetryConfig()` helper function
   - Added `isTimeoutError()` utility function
   - Improved timeout error messages

2. **lib/env.ts**
   - Added `EXPO_PUBLIC_TRPC_TIMEOUT` environment variable
   - Added validation for timeout configuration

---

## Related Issues

This fix also helps with:
- Poor connectivity in rural areas
- Mobile data throttling
- VPN/proxy slowdowns
- International users with high latency

---

## Support

If you experience timeout issues after this fix:
1. Check your network connection
2. Try increasing `EXPO_PUBLIC_TRPC_TIMEOUT` in `.env`
3. Check server logs for backend performance issues
4. Consider implementing offline-first patterns for critical operations

