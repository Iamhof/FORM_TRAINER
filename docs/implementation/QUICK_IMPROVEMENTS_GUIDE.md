# Quick Improvements Implementation Guide

This guide provides step-by-step instructions for implementing the most critical improvements identified in the analysis.

## 🚀 Priority 1: Logger Utility (2-3 hours)

### Step 1: Create Logger Utility

Create `lib/logger.ts`:

```typescript
const isDev = __DEV__;
const logLevel = (process.env.EXPO_PUBLIC_LOG_LEVEL || (isDev ? 'debug' : 'error')) as 'debug' | 'info' | 'warn' | 'error';

const sensitiveKeys = ['token', 'password', 'access_token', 'authorization', 'secret', 'key'];

function sanitize(data: any): any {
  if (!data || typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map(sanitize);
  }
  
  const sanitized: any = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitize(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export const logger = {
  debug: (...args: any[]) => {
    if (isDev && (logLevel === 'debug' || logLevel === 'info')) {
      console.log('[DEBUG]', ...args.map(sanitize));
    }
  },
  info: (...args: any[]) => {
    if (isDev && (logLevel === 'info' || logLevel === 'warn' || logLevel === 'error')) {
      console.info('[INFO]', ...args.map(sanitize));
    }
  },
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args.map(sanitize));
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args.map(sanitize));
  },
  sanitize,
};
```

### Step 2: Replace Console Statements

Use find/replace:
- `console.log(` → `logger.debug(`
- `console.info(` → `logger.info(`
- `console.warn(` → `logger.warn(`
- `console.error(` → `logger.error(`

**Files to prioritize**:
- `lib/trpc.ts`
- `backend/hono.ts`
- `app/api/trpc/[trpc]+api.ts`
- All context files

---

## 🚀 Priority 2: Fix Query Client (30 minutes)

### Update `app/_layout.tsx`

Replace the QueryClient configuration:

```typescript
const [queryClient] = useState(() => new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.data?.code === 'UNAUTHORIZED' || error?.data?.code === 'FORBIDDEN') {
          return false;
        }
        // Retry network errors up to 3 times
        if (error?.message?.includes('Network') || error?.message?.includes('timeout')) {
          return failureCount < 3;
        }
        return false;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      refetchOnMount: true, // Check for fresh data
      refetchOnWindowFocus: true, // Refetch when user returns
      refetchOnReconnect: true, // Refetch when connection restored
      networkMode: 'online', // Only fetch when online
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
}));
```

---

## 🚀 Priority 3: Add Request Timeouts (1 hour)

### Update `lib/trpc.ts`

Modify the fetch function:

```typescript
async fetch(url, options) {
  const baseUrl = getBaseUrl();
  const REQUEST_TIMEOUT = 30000; // 30 seconds
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // ... existing response handling code ...
    
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Request timeout - please try again');
      errorService.capture(timeoutError, {
        location: 'TRPC Client',
        url,
        baseUrl,
        timeout: REQUEST_TIMEOUT,
      });
      throw timeoutError;
    }
    
    // ... existing error handling ...
    throw error;
  }
}
```

---

## 🚀 Priority 4: Improve CORS Security (30 minutes)

### Update `backend/hono.ts`

Replace the CORS configuration:

```typescript
app.use(
  "*",
  cors({
    origin: (origin) => {
      // Reject requests without origin (except same-origin)
      if (!origin) {
        // Allow same-origin requests (no origin header)
        return true;
      }
      
      const allowedOrigins = [
        'http://localhost:8081',
        'http://localhost:19006',
        'http://localhost:3000',
        process.env.EXPO_PUBLIC_WEB_URL,
      ].filter(Boolean);
      
      // In development, allow localhost variants
      if (process.env.NODE_ENV === 'development' || __DEV__) {
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
          return origin;
        }
      }
      
      // In production, only allow whitelisted origins
      return allowedOrigins.includes(origin) ? origin : false;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposeHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 600,
    credentials: true,
  })
);
```

---

## 🚀 Priority 5: Environment Variable Validation (1 hour)

### Create `lib/env.ts`

```typescript
import { z } from 'zod';

const envSchema = z.object({
  // Client-side (must start with EXPO_PUBLIC_)
  EXPO_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key required'),
  EXPO_PUBLIC_RORK_API_BASE_URL: z.string().url().optional(),
  EXPO_PUBLIC_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),
  
  // Server-side only
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Service role key required').optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

export function validateEnv(): Env {
  if (validatedEnv) return validatedEnv;
  
  try {
    validatedEnv = envSchema.parse({
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      EXPO_PUBLIC_RORK_API_BASE_URL: process.env.EXPO_PUBLIC_RORK_API_BASE_URL,
      EXPO_PUBLIC_LOG_LEVEL: process.env.EXPO_PUBLIC_LOG_LEVEL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      NODE_ENV: process.env.NODE_ENV || 'development',
    });
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors
        .map(e => `${e.path.join('.')}: ${e.message}`)
        .join('\n');
      throw new Error(`Environment validation failed:\n${missing}`);
    }
    throw error;
  }
}

// Validate on import (client-side)
if (typeof window !== 'undefined' || typeof global !== 'undefined') {
  try {
    validateEnv();
  } catch (error) {
    console.error('[Env] Validation failed:', error);
    // Don't throw in client - let app handle gracefully
  }
}

export const env = validateEnv();
```

### Update `lib/supabase.ts`

```typescript
import { env } from './env';

const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// ... rest of the file
```

### Update `backend/lib/auth.ts`

```typescript
import { env } from '../../lib/env';

export const assertServiceKeys = (context = 'backend/lib/auth') => {
  try {
    const validated = env;
    if (!validated.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
    }
  } catch (error) {
    throw new Error(
      `[${context}] ${error instanceof Error ? error.message : 'Environment validation failed'}`
    );
  }
};

export const supabaseAdmin = createClient(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY!,
  // ... rest of config
);
```

---

## 🚀 Priority 6: Cache Static Data (1 hour)

### Create `lib/cache.ts`

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class Cache {
  private static async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`cache_${key}`);
      if (!cached) return null;
      
      const entry: CacheEntry<T> = JSON.parse(cached);
      const now = Date.now();
      
      if (now - entry.timestamp > entry.ttl) {
        // Expired, remove it
        await AsyncStorage.removeItem(`cache_${key}`);
        return null;
      }
      
      return entry.data;
    } catch (error) {
      console.error(`[Cache] Error reading ${key}:`, error);
      return null;
    }
  }
  
  private static async set<T>(key: string, data: T, ttl: number): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(entry));
    } catch (error) {
      console.error(`[Cache] Error writing ${key}:`, error);
    }
  }
  
  static async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = 24 * 60 * 60 * 1000 // 24 hours default
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    const fresh = await fetchFn();
    await this.set(key, fresh, ttl);
    return fresh;
  }
  
  static async invalidate(key: string): Promise<void> {
    await AsyncStorage.removeItem(`cache_${key}`);
  }
  
  static async clear(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith('cache_'));
    await AsyncStorage.multiRemove(cacheKeys);
  }
}
```

### Use in Exercise Library

```typescript
// hooks/useExercises.ts
import { Cache } from '@/lib/cache';
import { EXERCISE_LIBRARY } from '@/constants/exercise-library';

export function useExercises() {
  const [exercises, setExercises] = useState(EXERCISE_LIBRARY);
  
  useEffect(() => {
    // Cache exercise library for 7 days
    Cache.getOrFetch('exercise_library', async () => {
      // If you fetch from API in future:
      // return await trpc.exercises.list.query();
      return EXERCISE_LIBRARY;
    }, 7 * 24 * 60 * 60 * 1000).then(setExercises);
  }, []);
  
  return exercises;
}
```

---

## 🚀 Priority 7: Add Database Indexes (1 hour)

### Create Migration File

Create `supabase/migrations/20250115_add_performance_indexes.sql`:

```sql
-- Indexes for workouts table
CREATE INDEX IF NOT EXISTS idx_workouts_user_date 
  ON workouts(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_workouts_user_created 
  ON workouts(user_id, created_at DESC);

-- Indexes for analytics table
CREATE INDEX IF NOT EXISTS idx_analytics_user_exercise 
  ON analytics(user_id, exercise_id);

CREATE INDEX IF NOT EXISTS idx_analytics_user_date 
  ON analytics(user_id, date DESC);

-- Indexes for leaderboard_stats
CREATE INDEX IF NOT EXISTS idx_leaderboard_stats_volume 
  ON leaderboard_stats(total_volume_kg DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_stats_monthly_volume 
  ON leaderboard_stats(monthly_volume_kg DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_stats_sessions 
  ON leaderboard_stats(total_sessions DESC);

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id 
  ON profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_is_pt 
  ON profiles(is_pt) WHERE is_pt = true;

-- Indexes for pt_client_relationships
CREATE INDEX IF NOT EXISTS idx_pt_relationships_pt 
  ON pt_client_relationships(pt_id, status);

CREATE INDEX IF NOT EXISTS idx_pt_relationships_client 
  ON pt_client_relationships(client_id, status);

-- Indexes for body_metrics
CREATE INDEX IF NOT EXISTS idx_body_metrics_user_date 
  ON body_metrics(user_id, date DESC);
```

Run in Supabase SQL Editor or via migration.

---

## 📋 Implementation Checklist

- [ ] Create logger utility (`lib/logger.ts`)
- [ ] Replace all console.log statements
- [ ] Update QueryClient configuration
- [ ] Add request timeouts to tRPC client
- [ ] Improve CORS configuration
- [ ] Create environment validation (`lib/env.ts`)
- [ ] Update env usage in supabase.ts and auth.ts
- [ ] Create cache utility (`lib/cache.ts`)
- [ ] Implement caching for exercise library
- [ ] Create and run database indexes migration
- [ ] Test all changes in development
- [ ] Update documentation

---

## 🧪 Testing After Changes

1. **Test Logger**: Verify logs are sanitized and level-based
2. **Test Query Client**: Verify retries work on network errors
3. **Test Timeouts**: Simulate slow network, verify timeout errors
4. **Test CORS**: Try from different origins, verify blocking
5. **Test Env Validation**: Remove env var, verify clear error
6. **Test Caching**: Verify exercise library loads from cache
7. **Test Indexes**: Check query performance in Supabase dashboard

---

## 📝 Notes

- All changes are backward compatible
- No breaking changes to existing functionality
- Can be implemented incrementally
- Test each change before moving to the next

---

## 🎯 Estimated Time

- Logger: 2-3 hours
- Query Client: 30 minutes
- Request Timeouts: 1 hour
- CORS: 30 minutes
- Env Validation: 1 hour
- Caching: 1 hour
- Database Indexes: 1 hour

**Total: ~7-8 hours** for all quick wins





