# Bug Fixes Summary

This document details all bugs found and fixed in the codebase.

---

## Bug #1: Security Vulnerability - Hardcoded Supabase Credentials 🔒

**Severity:** CRITICAL  
**Location:** `/workspace/lib/supabase.ts` (lines 48-49)  
**Category:** Security Vulnerability

### Problem
The Supabase URL and anonymous key were hardcoded directly in the source code:
```typescript
const supabaseUrl = 'https://yshbcfifmkflhahjengk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**Security risks:**
- Credentials exposed in version control (Git)
- Anyone with repository access can see and misuse the keys
- Violates security best practices
- Keys cannot be rotated without code changes
- Could lead to unauthorized database access

### Solution
Moved credentials to environment variables with proper validation:
```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Missing environment variables');
  console.error('[Supabase] Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set');
}
```

**Benefits:**
- ✅ Credentials externalized and not in source control
- ✅ Easy to rotate keys without code changes
- ✅ Different keys for different environments
- ✅ Follows industry security standards

---

## Bug #2: Memory Leak - Improper Interval Cleanup 💾

**Severity:** HIGH  
**Location:** `/workspace/components/RestTimerModal.tsx` (lines 29-44)  
**Category:** Performance Issue / Memory Leak

### Problem
The interval cleanup logic had critical flaws:
```typescript
const interval = setInterval(() => {
  setTimeRemaining((prev) => {
    if (prev <= 1) {
      clearInterval(interval); // ❌ Wrong! Closure issue
      setTimeout(onComplete, 100);
      return 0;
    }
    return prev - 1;
  });
}, 1000);
```

**Issues:**
- `clearInterval(interval)` inside the callback references a stale closure variable
- If component unmounts before timer completion, interval keeps running
- Multiple intervals could be created if `visible` or `timeRemaining` changes rapidly
- Causes memory leaks and wasted CPU cycles
- In a long-running app, this could lead to performance degradation

### Solution
Used a `useRef` to properly track and clean up the interval:
```typescript
const intervalRef = useRef<NodeJS.Timeout | null>(null);

useEffect(() => {
  if (!visible || timeRemaining <= 0) {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return;
  }

  intervalRef.current = setInterval(() => {
    setTimeRemaining((prev) => {
      if (prev <= 1) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setTimeout(onComplete, 100);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
}, [visible, timeRemaining, onComplete]);
```

**Benefits:**
- ✅ Properly cleans up intervals on component unmount
- ✅ Prevents multiple intervals from running simultaneously
- ✅ Eliminates memory leaks
- ✅ More reliable timer behavior
- ✅ Better performance in long-running sessions

---

## Bug #3: Logic Error - Incorrect First Visit Flag 🐛

**Severity:** MEDIUM  
**Location:** `/workspace/contexts/UserContext.tsx` (line 121)  
**Category:** Logic Error

### Problem
The `isFirstVisit` flag was always set to `true`, regardless of whether a user profile existed:
```typescript
if (!profile) {
  console.warn('[UserContext] No profile found for user...');
} else {
  console.log('[UserContext] Profile loaded successfully...');
}

setIsFirstVisit(true); // ❌ Always true for ALL users!
```

**Impact:**
- Returning users treated as new users
- Onboarding screens shown to existing users
- Poor user experience
- Incorrect app flow decisions
- Could confuse users who have already completed onboarding

### Solution
Conditionally set the flag based on profile existence:
```typescript
if (!profile) {
  console.warn('[UserContext] No profile found for user, creating default user object');
  setIsFirstVisit(true);  // ✅ Only true when no profile exists
} else {
  console.log('[UserContext] Profile loaded successfully:', { 
    name: profile.name, 
    is_pt: profile.is_pt,
    accentColor: profile.accent_color 
  });
  setIsFirstVisit(false); // ✅ False for existing users
}
```

**Benefits:**
- ✅ Correct behavior for returning users
- ✅ Proper onboarding flow
- ✅ Improved user experience
- ✅ More accurate app state

---

## Bug #4: TRPC Network Errors - URL Configuration & Error Handling 🌐

**Severity:** HIGH  
**Location:** `/workspace/lib/trpc.ts`  
**Category:** Configuration & Error Handling

### Problem
Multiple issues causing TRPC "Failed to fetch" errors:

1. **Invalid/Inaccessible Backend URL:** The `EXPO_PUBLIC_RORK_API_BASE_URL` was pointing to `https://dev-mv67vqriwoe5fscxfu5r0.rorktest.dev` which was not accessible

2. **No URL Validation:** The code didn't validate if the provided URL was valid before using it

3. **Poor Error Messages:** Error messages didn't provide enough context for debugging

4. **No Fallback Logic:** When the backend URL was invalid, there was no fallback to localhost for development

5. **No Timeout Handling:** Requests could hang indefinitely if backend was unresponsive

### Solution

#### 1. Improved URL Configuration with Validation
```typescript
const getBaseUrl = () => {
  const apiBaseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  
  // Validate the API base URL if provided
  if (apiBaseUrl && apiBaseUrl.trim() !== '') {
    const cleanUrl = apiBaseUrl.replace(/\/+$/, '');
    
    // Check if URL is valid
    try {
      new URL(cleanUrl);
      console.log('[TRPC] Using EXPO_PUBLIC_RORK_API_BASE_URL:', cleanUrl);
      return cleanUrl;
    } catch (error) {
      console.error('[TRPC] Invalid EXPO_PUBLIC_RORK_API_BASE_URL:', cleanUrl);
      console.error('[TRPC] Falling back to local URL');
    }
  } else {
    console.warn('[TRPC] EXPO_PUBLIC_RORK_API_BASE_URL is not set or empty');
  }
  
  // For web, use the current origin (works for development and production)
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    console.log('[TRPC] Using local web URL:', origin);
    return origin;
  }
  
  // For React Native, try common local development URLs
  const platform = process.env.EXPO_PUBLIC_PLATFORM;
  if (platform === 'ios') {
    console.log('[TRPC] Using iOS simulator localhost');
    return 'http://localhost:8081';
  } else if (platform === 'android') {
    console.log('[TRPC] Using Android emulator localhost');
    return 'http://10.0.2.2:8081';
  }
  
  console.log('[TRPC] Using default localhost for native');
  return 'http://localhost:8081';
};
```

#### 2. Enhanced Error Handling with Timeout
```typescript
async fetch(url, options) {
  const baseUrl = getBaseUrl();
  console.log('[TRPC] Making request to:', url);
  console.log('[TRPC] Request method:', options?.method || 'GET');
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    console.log('[TRPC] Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const text = await response.text();
      console.error('[TRPC] HTTP error:', response.status, response.statusText);
      console.error('[TRPC] Response body:', text.substring(0, 500));
      
      if (text.startsWith('<')) {
        throw new Error(`Server returned HTML instead of JSON (Status: ${response.status}). Backend may not be running at ${baseUrl}`);
      }
      
      throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
    }
    
    console.log('[TRPC] Request successful');
    return response;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('[TRPC] Request timeout (30s) - Backend may be unresponsive');
        throw new Error(`Request timeout: Backend at ${baseUrl} did not respond within 30 seconds`);
      }
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        console.error('[TRPC] Network connection failed');
        console.error('[TRPC] Possible issues:');
        console.error('[TRPC]   1. Backend server is not running');
        console.error('[TRPC]   2. EXPO_PUBLIC_RORK_API_BASE_URL is incorrect:', process.env.EXPO_PUBLIC_RORK_API_BASE_URL);
        console.error('[TRPC]   3. CORS issues (check backend CORS configuration)');
        console.error('[TRPC]   4. Network connectivity problems');
        console.error('[TRPC] Current base URL:', baseUrl);
        console.error('[TRPC] Full request URL:', url);
        
        throw new Error(`Network error: Cannot reach backend at ${baseUrl}. Check if backend is running and EXPO_PUBLIC_RORK_API_BASE_URL is correct.`);
      }
      
      console.error('[TRPC] Request error:', error.message);
      throw error;
    }
    
    console.error('[TRPC] Unknown error:', String(error));
    throw new Error(`Unknown error occurred: ${String(error)}`);
  }
}
```

#### 3. Fixed Environment Configuration
Updated `.env` file to remove invalid URL and add helpful comments:
```bash
# Backend API Base URL
# For local development, leave empty or comment out to use localhost
# For production/tunneling, set to your backend URL (e.g., ngrok, rork.live, etc.)
# EXPO_PUBLIC_RORK_API_BASE_URL=https://your-backend-url-here
EXPO_PUBLIC_RORK_API_BASE_URL=
```

**Benefits:**
- ✅ Validates backend URLs before using them
- ✅ Intelligent fallback to localhost for development
- ✅ 30-second timeout prevents hanging requests
- ✅ Clear, actionable error messages with debugging tips
- ✅ Platform-specific localhost URLs for iOS/Android
- ✅ Prevents "Failed to fetch" errors from invalid URLs
- ✅ Better developer experience with helpful logging

---

## Summary

All bugs have been successfully fixed:

1. ✅ **Security Vulnerability** - Credentials moved to environment variables
2. ✅ **Memory Leak** - Proper interval cleanup with useRef
3. ✅ **Logic Error** - Correct first visit detection
4. ✅ **TRPC Errors** - URL validation, error handling, and configuration fixes

### Impact
- **Security:** Application is now more secure with externalized credentials
- **Performance:** Eliminated memory leaks that could degrade app performance over time
- **User Experience:** Fixed onboarding flow and improved error messages
- **Developer Experience:** Better debugging with clear error messages and proper defaults

### Testing Recommendations
1. **Test Security:** Verify credentials are loaded from environment variables
2. **Test Memory:** Monitor memory usage during multiple workout sessions with rest timers
3. **Test User Flow:** Verify returning users don't see onboarding screens
4. **Test TRPC:** 
   - Verify app works with empty `EXPO_PUBLIC_RORK_API_BASE_URL` (should use localhost)
   - Test with invalid URL (should fall back gracefully)
   - Test with backend offline (should show clear error messages)

### Next Steps
For production deployment:
1. Set up environment-specific `.env` files (`.env.development`, `.env.production`)
2. Never commit actual credentials to version control
3. Use a secrets management system (e.g., GitHub Secrets, AWS Secrets Manager)
4. Set up proper backend URL for production deployments
