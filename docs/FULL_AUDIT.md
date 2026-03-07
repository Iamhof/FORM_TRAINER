# Form Workout Tracker - Full Architecture Audit

**Audit Date:** 2026-02-02
**Auditor:** Claude (Senior Developer)
**Phases Completed:** Pass 1 (Architecture), Pass 3 (Performance), Pass 4 (Code Quality), Pass 5 (Recommendations)

---

## Table of Contents

### Pass 1 - Architecture & Structure
1. [Executive Summary](#1-executive-summary)
2. [Project Structure and Organization](#2-project-structure-and-organization)
3. [Frontend-Backend Communication](#3-frontend-backend-communication)
4. [Authentication Flow](#4-authentication-flow)
5. [Database Schema and Relationships](#5-database-schema-and-relationships)
6. [API Routes/Endpoints Inventory](#6-api-routesendpoints-inventory)
7. [State Management Approach](#7-state-management-approach)
8. [Environment/Config Setup](#8-environmentconfig-setup)
9. [Known Issues and Pain Points](#9-known-issues-and-pain-points)

### Pass 3 - Performance & Scalability
10. [Performance Audit Summary](#10-performance-audit-summary)
11. [Database Query Efficiency](#11-database-query-efficiency)
12. [Frontend Rendering Performance](#12-frontend-rendering-performance)
13. [API Response Times](#13-api-response-times)
14. [Caching Strategy Analysis](#14-caching-strategy-analysis)
15. [Scalability Assessment: 10 to 10,000 Users](#15-scalability-assessment-10-to-10000-users)

### Pass 4 - Code Quality & Maintainability
17. [Code Quality Summary](#17-code-quality-summary)
18. [TypeScript Usage & Type Safety](#18-typescript-usage--type-safety)
19. [Error Handling Patterns](#19-error-handling-patterns)
20. [Code Duplication Analysis](#20-code-duplication-analysis)
21. [Test Coverage Assessment](#21-test-coverage-assessment)
22. [Dead Code & Unused Dependencies](#22-dead-code--unused-dependencies)
23. [Naming Conventions & Consistency](#23-naming-conventions--consistency)

### Pass 5 - Recommendations & Roadmap
25. [Top 10 Critical Fixes](#25-top-10-critical-fixes-before-going-live)
26. [Top 10 Improvements](#26-top-10-improvements-quality--user-experience)
27. [Architecture Recommendations](#27-architecture-recommendations-for-analytics--leaderboard)
28. [Deployment Checklist](#28-deployment-checklist-testflight-to-app-store)
29. [Summary & Priority Matrix](#29-summary--priority-matrix)

---

## 1. Executive Summary

### Application Overview

**Form Workout Tracker** is a React Native mobile application for fitness tracking with personal trainer management capabilities. The app is currently in TestFlight beta testing.

### Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React Native 0.81.5 via Expo 54.0.32 |
| **Navigation** | Expo Router 6.0.22 (file-based routing) |
| **Backend** | Hono 4.9.12 on Vercel Serverless Functions |
| **API Layer** | tRPC 11.6.0 for type-safe RPC |
| **Database** | Supabase PostgreSQL (West Europe/London on AWS) |
| **Authentication** | Supabase Auth with JWT tokens |
| **State Management** | React Context + React Query 5.90.6 |
| **Error Tracking** | Sentry React Native 7.2.0 |

### Current Feature Status

| Feature | Status |
|---------|--------|
| Account creation/Sign Up | Implemented |
| Login | Implemented |
| Programme creation | Implemented (KNOWN ISSUE: Save not working) |
| Session recording | Implemented |
| Profile/Settings | Implemented |
| Analytics | Coming Soon (providers commented out) |
| Leaderboards | Coming Soon (providers commented out) |

---

## 2. Project Structure and Organization

### Root Directory Layout

```
Form-app-main/
├── api/                    # Vercel serverless API handlers
│   └── trpc/
│       └── [trpc].ts       # Main tRPC handler for Vercel
├── app/                    # Expo Router screens (file-based routing)
│   ├── (tabs)/             # Tab navigation screens
│   ├── api/                # Expo Router API routes (local dev)
│   ├── create-programme/   # Programme creation flow
│   ├── exercises/          # Exercise browser
│   ├── leaderboard/        # Leaderboard screens
│   ├── legal/              # Terms & Privacy
│   ├── programme/          # Programme details
│   ├── pt/                 # Personal trainer screens
│   ├── session/            # Workout session screens
│   ├── _layout.tsx         # Root layout with providers
│   ├── auth.tsx            # Login/Signup screen
│   ├── index.tsx           # Landing/Splash
│   └── ...
├── backend/                # Hono + tRPC backend code
│   ├── lib/
│   │   └── auth.ts         # Supabase admin client
│   ├── trpc/
│   │   ├── app-router.ts   # Main tRPC router
│   │   ├── create-context.ts # tRPC context factory
│   │   └── routes/         # All tRPC route handlers
│   └── hono.ts             # Hono app entry point
├── components/             # Reusable React Native components
├── constants/              # Theme, colors, exercise library
├── contexts/               # React Context providers
├── hooks/                  # Custom React hooks
├── lib/                    # Utility libraries
│   ├── env.ts              # Environment validation (Zod)
│   ├── logger.ts           # Logging service
│   ├── supabase.ts         # Supabase client (frontend)
│   └── trpc.ts             # tRPC client setup
├── services/               # Business logic services
│   └── error.service.ts    # Error handling + Sentry
├── supabase/               # Database schema and migrations
│   ├── migrations/         # SQL migration files
│   ├── schema.sql          # Complete schema export
│   └── seed_exercises.sql  # Exercise library seed data
├── types/                  # TypeScript type definitions
│   └── database.ts         # Database entity types
├── .env.example            # Environment variable template
├── app.json                # Expo app configuration
├── eas.json                # EAS build configuration
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── vercel.json             # Vercel deployment config
```

### File Organization Patterns

1. **Feature-based screens**: Screens are organized by feature in `app/` using Expo Router's file-based routing
2. **Domain-based backend routes**: tRPC routes in `backend/trpc/routes/` are organized by domain (programmes, workouts, analytics, etc.)
3. **Shared utilities in lib/**: Cross-cutting concerns like logging, environment, and clients
4. **Context providers in contexts/**: State management split by domain

---

## 3. Frontend-Backend Communication

### Communication Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              MOBILE APP                                  │
│  ┌─────────────┐    ┌───────────────┐    ┌─────────────────────────┐   │
│  │   Screens   │───>│ Context/Hooks │───>│    tRPC Client          │   │
│  │  (app/*.tsx)│    │(contexts/*.tsx)│    │   (lib/trpc.ts)         │   │
│  └─────────────┘    └───────────────┘    └────────────┬────────────┘   │
└────────────────────────────────────────────────────────┼────────────────┘
                                                         │
                                                         │ HTTP POST/GET
                                                         │ Authorization: Bearer <JWT>
                                                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           VERCEL SERVERLESS                              │
│  ┌─────────────────────┐    ┌────────────────┐    ┌─────────────────┐  │
│  │ /api/trpc/[trpc].ts │───>│   hono.ts      │───>│  app-router.ts  │  │
│  │   (Entry Point)     │    │ (CORS/Middleware)   │(tRPC Router)    │  │
│  └─────────────────────┘    └────────────────┘    └───────┬─────────┘  │
└───────────────────────────────────────────────────────────┼─────────────┘
                                                            │
                                                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              SUPABASE                                    │
│  ┌─────────────────────┐    ┌────────────────────────────────────────┐ │
│  │   Supabase Auth     │    │      PostgreSQL Database               │ │
│  │  (JWT Validation)   │    │  (RLS Policies + Service Role Access)  │ │
│  └─────────────────────┘    └────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### tRPC Client Configuration

**Location:** `lib/trpc.ts`

```typescript
// Key configuration
const TIMEOUT_CONFIG = {
  DEFAULT: 60000,        // 60 seconds
  QUICK_OPERATION: 30000, // 30 seconds
  HEAVY_OPERATION: 90000, // 90 seconds
  BATCH_OPERATION: 120000, // 2 minutes
};

// Client setup
export const trpc = createTRPCReact<AppRouter>();

trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${baseUrl}/api/trpc`,
      transformer: superjson,
      async headers() {
        const session = await supabase.auth.getSession();
        const token = session?.data?.session?.access_token;
        return {
          authorization: token ? `Bearer ${token}` : '',
        };
      },
      // Custom fetch with timeout and error handling
    }),
  ],
});
```

### URL Resolution Logic

**Priority order for API base URL:**
1. `EXPO_PUBLIC_RORK_API_BASE_URL` environment variable
2. `Constants.expoConfig.hostUri` (Expo development server)
3. `window.location.origin` (web platform)
4. Fallback: `http://localhost:8081`

**Critical Issue Detected:** Tunnel mode detection warns that API routes don't work through Expo tunnels.

### Backend Request Handling

**Location:** `api/trpc/[trpc].ts`

The Vercel serverless function:
1. Receives requests at `/api/trpc/*`
2. Strips the `/api` prefix for Hono routing
3. Creates a proper Request object for Hono
4. Lazily initializes the Hono app on cold start
5. Returns JSON responses (with HTML error detection)

**Location:** `backend/hono.ts`

The Hono app:
1. Applies CORS middleware (localhost + production URLs allowed)
2. Adds request ID and performance monitoring
3. Routes `/trpc/*` to tRPC server
4. Provides health check endpoints (`/`, `/health`)

---

## 4. Authentication Flow

### Overview

Authentication uses **Supabase Auth** with JWT tokens, stored securely using Expo SecureStore on native platforms.

### Sign Up Flow

```
1. User enters email/password on AuthScreen (app/auth.tsx)
                    │
                    ▼
2. UserContext.signup() called
   - Calls supabase.auth.signUp()
   - Creates auth.users entry in Supabase
                    │
                    ▼
3. Supabase trigger (on_auth_user_created) creates profile row
   - Creates entry in public.profiles table
   - Sets default values (is_pt: false, role: 'user')
                    │
                    ▼
4. On success, redirect to /profile-setup
   - User sets name and preferences
   - Updates profiles table via Supabase client
                    │
                    ▼
5. UserContext.loadUserProfile() fetches profile
   - Sets user state in context
   - Sets isFirstVisit based on profile existence
```

### Sign In Flow

```
1. User enters email/password on AuthScreen (app/auth.tsx)
                    │
                    ▼
2. UserContext.signin() called
   - Calls supabase.auth.signInWithPassword()
   - Returns session with JWT access_token
                    │
                    ▼
3. Supabase onAuthStateChange fires
   - Session stored in state
   - loadUserProfile() called
                    │
                    ▼
4. Profile loaded from Supabase
   - Fetches from profiles table
   - Maps snake_case to camelCase
                    │
                    ▼
5. Redirect to /(tabs)/home
```

### Session Management

**Location:** `lib/supabase.ts`

```typescript
// Token storage adapter
const SecureStoreAdapter = {
  getItem: (key) => SecureStore.getItemAsync(key),  // Native
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
  // Falls back to localStorage on web
};

// Supabase client configuration
supabaseClient = createClient(url, anonKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### Backend Authentication

**Location:** `backend/trpc/create-context.ts`

```typescript
// Token resolution on every request
const resolveUserFromToken = async (token?: string | null) => {
  if (!token) return { userId: null, userEmail: null };

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) return { userId: null, userEmail: null };

  return { userId: user.id, userEmail: user.email ?? null };
};

// Context creation
export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const authHeader = opts.req.headers.get('authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim() || null;
  const { userId, userEmail } = await resolveUserFromToken(token);

  return { req: opts.req, requestId, userId, userEmail };
};
```

### Protected Procedures

```typescript
export const protectedProcedure = validatedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});
```

---

## 5. Database Schema and Relationships

### Entity Relationship Diagram (Text)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   auth.users    │     │    profiles     │     │   programmes    │
│   (Supabase)    │────<│                 │────<│                 │
│                 │     │ user_id (FK)    │     │ user_id (FK)    │
│ id              │     │ name            │     │ name            │
│ email           │     │ is_pt           │     │ days            │
│ ...             │     │ accent_color    │     │ weeks           │
└─────────────────┘     │ gender          │     │ exercises (JSONB)│
        │               └─────────────────┘     └─────────────────┘
        │                                               │
        │                                               │
        ▼                                               ▼
┌─────────────────┐                         ┌─────────────────┐
│    workouts     │                         │   schedules     │
│                 │<────────────────────────│                 │
│ user_id (FK)    │                         │ user_id (FK)    │
│ programme_id    │                         │ programme_id    │
│ day             │                         │ week_start      │
│ week            │                         │ schedule (JSONB)│
│ exercises (JSONB)                         └─────────────────┘
│ completed_at    │
└─────────────────┘
        │
        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   analytics     │     │ personal_records│     │  body_metrics   │
│                 │     │                 │     │                 │
│ user_id         │     │ user_id         │     │ user_id         │
│ exercise_id     │     │ exercise_id     │     │ date            │
│ date            │     │ weight          │     │ weight          │
│ max_weight      │     │ reps            │     │ muscle_mass     │
│ total_volume    │     │ date            │     │ body_fat_pct    │
│ total_reps      │     └─────────────────┘     └─────────────────┘
└─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ pt_client_      │     │ pt_invitations  │     │shared_programmes│
│ relationships   │     │                 │     │                 │
│                 │     │ pt_id           │     │ programme_id    │
│ pt_id           │     │ email           │     │ pt_id           │
│ client_id       │     │ token           │     │ client_id       │
│ status          │     │ status          │     │ shared_at       │
└─────────────────┘     │ expires_at      │     └─────────────────┘
                        └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│ leaderboard_    │     │ leaderboard_    │
│ profiles        │     │ stats           │
│                 │     │                 │
│ user_id         │     │ user_id         │
│ is_opted_in     │     │ total_volume_kg │
│ display_name    │     │ monthly_volume  │
│ show_real_name  │     │ total_sessions  │
│ gender          │     │ ranks...        │
└─────────────────┘     └─────────────────┘
```

### Table Details

#### Core Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | User profile data | user_id, name, is_pt, accent_color, gender |
| `programmes` | Training programmes | user_id, name, days, weeks, exercises (JSONB) |
| `workouts` | Completed sessions | user_id, programme_id, day, week, exercises (JSONB), completed_at |
| `analytics` | Exercise stats per day | user_id, exercise_id, date, max_weight, total_volume, total_reps |
| `schedules` | Weekly schedules | user_id, programme_id, week_start, schedule (JSONB) |

#### PT/Client Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `pt_client_relationships` | PT-client links | pt_id, client_id, status |
| `pt_invitations` | Invitation tokens | pt_id, email, token, status, expires_at |
| `shared_programmes` | Shared workouts | programme_id, pt_id, client_id |
| `client_progress_sharing` | Sharing preferences | client_id, share_workouts, share_analytics |

#### Tracking Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `body_metrics` | Body measurements | user_id, date, weight, muscle_mass, body_fat_percentage |
| `personal_records` | Personal bests | user_id, exercise_id, weight, reps, date |
| `user_visits` | Visit tracking | user_id, visit_date |
| `weekly_completions` | Weekly progress | user_id, programme_id, week_start_date, completed_sessions |

#### Leaderboard Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `leaderboard_profiles` | Opt-in settings | user_id, is_opted_in, display_name, show_in_* |
| `leaderboard_stats` | Cached rankings | user_id, total_volume_kg, monthly_*, *_rank |

### JSONB Column Structures

**programmes.exercises:**
```typescript
{
  day: number;        // 1-indexed day number
  exerciseId: string; // Exercise identifier
  sets: number;       // Number of sets
  reps: string;       // Reps (can be range like "8-12")
  rest: number;       // Rest time in seconds
}[]
```

**workouts.exercises:**
```typescript
{
  exerciseId: string;
  sets: {
    weight: number;
    reps: number;
    completed: boolean;
  }[];
}[]
```

**schedules.schedule:**
```typescript
{
  dayOfWeek: number;  // 0-6 (Sunday-Saturday)
  status: 'scheduled' | 'completed' | 'rest' | 'empty';
  sessionId?: string;
  weekStart: string;  // ISO date
}[]
```

---

## 6. API Routes/Endpoints Inventory

### tRPC Router Structure

**Location:** `backend/trpc/app-router.ts`

```typescript
export const appRouter = createTRPCRouter({
  example: createTRPCRouter({ hi }),
  auth: createTRPCRouter({ me }),
  exercises: createTRPCRouter({ list }),
  programmes: createTRPCRouter({ create, list, get, delete }),
  workouts: createTRPCRouter({ log, history }),
  analytics: createTRPCRouter({ get, sync, getVolume, overview }),
  pt: createTRPCRouter({ /* 12 procedures */ }),
  clients: createTRPCRouter({ getMyPT, listSharedProgrammes }),
  bodyMetrics: createTRPCRouter({ log, list, latest, delete }),
  personalRecords: createTRPCRouter({ list, checkAndRecord }),
  schedules: createTRPCRouter({ get, update, assignSession, toggleDay }),
  profile: createTRPCRouter({ updateColor, update }),
  leaderboard: createTRPCRouter({ updateProfile, getProfile, getRankings, getMyRank }),
});
```

### Complete Endpoint Inventory

#### Authentication (auth.*)
| Endpoint | Type | Protection | Description |
|----------|------|------------|-------------|
| `auth.me` | Query | Protected | Get current user profile |

#### Exercises (exercises.*)
| Endpoint | Type | Protection | Description |
|----------|------|------------|-------------|
| `exercises.list` | Query | Public | List all exercises |

#### Programmes (programmes.*)
| Endpoint | Type | Protection | Description |
|----------|------|------------|-------------|
| `programmes.create` | Mutation | Protected | Create new programme |
| `programmes.list` | Query | Protected | List user's programmes |
| `programmes.get` | Query | Protected | Get single programme |
| `programmes.delete` | Mutation | Protected | Delete programme |

#### Workouts (workouts.*)
| Endpoint | Type | Protection | Description |
|----------|------|------------|-------------|
| `workouts.log` | Mutation | Protected | Log completed workout |
| `workouts.history` | Query | Protected | Get workout history |

#### Analytics (analytics.*)
| Endpoint | Type | Protection | Description |
|----------|------|------------|-------------|
| `analytics.get` | Query | Protected | Get exercise analytics |
| `analytics.sync` | Mutation | Protected | Sync analytics data |
| `analytics.getVolume` | Query | Protected | Get volume data |
| `analytics.overview` | Query | Protected | Get analytics overview |

#### PT Management (pt.*)
| Endpoint | Type | Protection | Description |
|----------|------|------------|-------------|
| `pt.inviteClient` | Mutation | Protected | Send PT invitation |
| `pt.acceptInvitation` | Mutation | Protected | Accept invitation |
| `pt.cancelInvitation` | Mutation | Protected | Cancel pending invitation |
| `pt.resendInvitation` | Mutation | Protected | Resend invitation |
| `pt.listInvitations` | Query | Protected | List pending invitations |
| `pt.listClients` | Query | Protected | List PT's clients |
| `pt.removeClient` | Mutation | Protected | Remove client |
| `pt.shareProgramme` | Mutation | Protected | Share programme with client |
| `pt.unshareProgramme` | Mutation | Protected | Unshare programme |
| `pt.getClientAnalytics` | Query | Protected | Get client's analytics |
| `pt.getClientWorkouts` | Query | Protected | Get client's workouts |

#### Client Views (clients.*)
| Endpoint | Type | Protection | Description |
|----------|------|------------|-------------|
| `clients.getMyPT` | Query | Protected | Get assigned PT |
| `clients.listSharedProgrammes` | Query | Protected | List PT-shared programmes |

#### Body Metrics (bodyMetrics.*)
| Endpoint | Type | Protection | Description |
|----------|------|------------|-------------|
| `bodyMetrics.log` | Mutation | Protected | Log body metrics |
| `bodyMetrics.list` | Query | Protected | List body metrics history |
| `bodyMetrics.latest` | Query | Protected | Get latest metrics |
| `bodyMetrics.delete` | Mutation | Protected | Delete metrics entry |

#### Personal Records (personalRecords.*)
| Endpoint | Type | Protection | Description |
|----------|------|------------|-------------|
| `personalRecords.list` | Query | Protected | List personal records |
| `personalRecords.checkAndRecord` | Mutation | Protected | Check and record new PR |

#### Schedules (schedules.*)
| Endpoint | Type | Protection | Description |
|----------|------|------------|-------------|
| `schedules.get` | Query | Protected | Get user's schedule |
| `schedules.update` | Mutation | Protected | Update schedule |
| `schedules.assignSession` | Mutation | Protected | Assign session to day |
| `schedules.toggleDay` | Mutation | Protected | Toggle schedule day |

#### Profile (profile.*)
| Endpoint | Type | Protection | Description |
|----------|------|------------|-------------|
| `profile.update` | Mutation | Protected | Update user profile |
| `profile.updateColor` | Mutation | Protected | Update accent color |

#### Leaderboard (leaderboard.*)
| Endpoint | Type | Protection | Description |
|----------|------|------------|-------------|
| `leaderboard.updateProfile` | Mutation | Protected | Update leaderboard profile |
| `leaderboard.getProfile` | Query | Protected | Get leaderboard profile |
| `leaderboard.getRankings` | Query | Public | Get rankings by category |
| `leaderboard.getMyRank` | Query | Protected | Get current user's rank |

---

## 7. State Management Approach

### Architecture Overview

State management uses a **hybrid approach**:

1. **React Context** for global app state (user, theme, programmes)
2. **React Query** (via tRPC) for server state and caching
3. **Local component state** for UI-specific state

### Context Provider Hierarchy

**Location:** `app/_layout.tsx`

```tsx
<ErrorBoundary>
  <EnvCheck>
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <UserProvider>               {/* 1. Auth & user data */}
          <ThemeProvider>            {/* 2. App theming */}
            <ProgrammeProvider>      {/* 3. Workout programmes */}
              {/* MVP: Commented out providers */}
              {/* <AnalyticsProvider> */}
              {/* <ScheduleProvider> */}
              {/* <BodyMetricsProvider> */}
              {/* <LeaderboardProvider> */}
              <GestureHandlerRootView>
                <RootLayoutNav />
              </GestureHandlerRootView>
            </ProgrammeProvider>
          </ThemeProvider>
        </UserProvider>
      </trpc.Provider>
    </QueryClientProvider>
  </EnvCheck>
</ErrorBoundary>
```

### Context Implementations

#### UserContext (`contexts/UserContext.tsx`)

**Purpose:** Authentication state, user profile, stats

**State:**
```typescript
{
  user: UserProfile | null;
  session: Session | null;
  stats: UserStats;
  isLoading: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  isFirstVisit: boolean;
}
```

**Actions:**
- `signin(email, password)` - Sign in user
- `signup(email, password, name)` - Create account
- `signout()` - Sign out user
- `updateProfile(updates)` - Update profile
- `updateStats(newStats)` - Update user stats

**Data Source:** Direct Supabase client calls

#### ProgrammeContext (`contexts/ProgrammeContext.tsx`)

**Purpose:** Training programmes, workout history, progress tracking

**State:**
```typescript
{
  programmes: Programme[];
  isLoading: boolean;
  activeProgramme: Programme | null;
  completedSessions: Map<string, number>;
  completedSessionKeys: Set<string>;
}
```

**Actions:**
- `addProgramme(programme)` - Create programme
- `deleteProgramme(id)` - Delete programme
- `getProgramme(id)` - Get programme by ID
- `getProgrammeProgress(id)` - Get completion stats
- `isSessionCompleted(programmeId, day, week)` - Check completion
- `isProgrammeCompleted(programmeId)` - Check if fully done
- `refetch()` - Refresh data

**Data Source:** tRPC queries (`programmes.list`, `workouts.history`) with Supabase fallback

**Fallback Mechanism:** When tRPC fails (e.g., tunnel mode), context falls back to direct Supabase client calls.

#### ThemeContext (`contexts/ThemeContext.tsx`)

**Purpose:** App theming with user accent color

**State:**
```typescript
{
  theme: 'dark' | 'light';
  accentColor: string;
}
```

**Data Source:** Derived from UserContext's user.accentColor

### React Query Configuration

**Location:** `app/_layout.tsx`

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry 4xx errors
        if (error?.data?.code === 'UNAUTHORIZED') return false;
        // Retry network errors up to 3 times
        if (error?.message?.includes('Network')) return failureCount < 3;
        return false;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 30 * 1000,       // 30 seconds
      gcTime: 5 * 60 * 1000,      // 5 minutes
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});
```

### Data Flow Pattern

```
┌─────────────────────────────────────────────────────────┐
│                     Component                            │
│  ┌─────────────────────────────────────────────────┐    │
│  │              useContext(UserContext)             │    │
│  │              useProgrammes()                     │    │
│  │              trpc.*.useQuery/useMutation()       │    │
│  └─────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────-─┘
                            │
           ┌────────────────┼────────────────┐
           ▼                ▼                ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │ UserContext  │ │ Programme    │ │ React Query  │
    │ (Direct      │ │ Context      │ │ Cache        │
    │  Supabase)   │ │ (tRPC+       │ │              │
    │              │ │  Fallback)   │ │              │
    └──────────────┘ └──────────────┘ └──────────────┘
           │                │                │
           └────────────────┼────────────────┘
                            ▼
                    ┌──────────────┐
                    │   Supabase   │
                    │   Backend    │
                    └──────────────┘
```

---

## 8. Environment/Config Setup

### Environment Variables

**Location:** `.env.example` and `lib/env.ts`

#### Client-Side Variables (EXPO_PUBLIC_*)

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `EXPO_PUBLIC_RORK_API_BASE_URL` | No | API backend URL override |
| `EXPO_PUBLIC_LOG_LEVEL` | No | debug\|info\|warn\|error |
| `EXPO_PUBLIC_WEB_URL` | No | Web app URL for CORS |
| `EXPO_PUBLIC_TRPC_TIMEOUT` | No | Request timeout (ms) |

#### Server-Side Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (backend) | Admin access key |
| `NODE_ENV` | No | development\|production\|test |

### Environment Validation

**Location:** `lib/env.ts`

Uses Zod schema validation with graceful fallback:

```typescript
const envSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key required'),
  EXPO_PUBLIC_RORK_API_BASE_URL: z.string().url().optional(),
  EXPO_PUBLIC_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});
```

If validation fails, app uses fallback values with `MISSING_ENV_VAR` markers to allow graceful error display.

### Vercel Configuration

**Location:** `vercel.json`

```json
{
  "framework": null,
  "buildCommand": "npx expo export -p web",
  "outputDirectory": "dist",
  "installCommand": "npm install --legacy-peer-deps",
  "rewrites": [
    {
      "source": "/api/trpc/:path*",
      "destination": "/api/trpc/[trpc]"
    }
  ]
}
```

**Key Points:**
- No framework detection (uses custom build)
- Exports Expo web build to `dist/`
- Uses legacy-peer-deps for npm compatibility
- Rewrites all `/api/trpc/*` to single handler

### EAS Build Configuration

**Location:** `eas.json`

Defines build profiles for:
- `development` - Dev client builds
- `preview` - TestFlight/internal testing
- `production` - App Store/Play Store

### Expo App Configuration

**Location:** `app.json`

```json
{
  "expo": {
    "name": "Form Workout Tracker",
    "slug": "expo-app",
    "version": "1.0.0",
    "scheme": "expo-app",
    "platforms": ["ios", "android", "web"],
    "ios": {
      "bundleIdentifier": "com.rork.form",
      "supportsTablet": true
    },
    "android": {
      "package": "com.rork.form"
    }
  }
}
```

---

## 9. Known Issues and Pain Points

### Critical Issue: Programme Saving Not Working

**Symptom:** Clicking "Save Programme" does nothing

**Location:** `app/create-programme/review.tsx`

**Flow Analysis:**

```typescript
const handleSave = async () => {
  // 1. Builds exercises array from days
  const exercises = days.flatMap((day, dayIndex) =>
    day.exercises.map(exercise => ({
      day: dayIndex + 1,
      exerciseId: exercise.id,
      sets: exercise.sets,
      reps: exercise.reps.toString(),
      rest: exercise.rest,
    }))
  );

  // 2. Validation
  if (!programmeName || programmeName.trim() === '') {
    alert('Please enter a programme name.');
    return;
  }
  if (exercises.length === 0) {
    alert('Please add at least one exercise.');
    return;
  }

  // 3. Call addProgramme via context
  await addProgramme({
    name: programmeName,
    days: frequency,
    weeks: duration,
    exercises,
  });

  // 4. Navigate on success
  router.push('/(tabs)/home');
};
```

**ProgrammeContext.addProgramme:**

```typescript
const addProgramme = useCallback(async (programme) => {
  if (!user) throw new Error('Not authenticated');

  try {
    // Primary: tRPC mutation
    const result = await createMutationRef.current.mutateAsync({
      name: programme.name,
      days: programme.days,
      weeks: programme.weeks,
      exercises: programme.exercises,
    });
    return result;
  } catch (error) {
    // Fallback: Direct Supabase if tRPC fails with HTML error
    if (errorMessage.includes('HTML instead of JSON')) {
      const { data, error } = await supabase
        .from('programmes')
        .insert({...})
        .select()
        .single();
      return data;
    }
    throw error;
  }
}, [user, usingFallback]);
```

**Backend Route (`programmes/create/route.ts`):**

```typescript
export const createProgrammeProcedure = protectedProcedure
  .input(z.object({
    name: z.string().min(1),
    days: z.number().min(1),
    weeks: z.number().min(1),
    exercises: z.array(exerciseSchema),
  }))
  .mutation(async ({ ctx, input }) => {
    // Check for duplicate name
    const { data: existing } = await supabaseAdmin
      .from('programmes')
      .select('id')
      .eq('user_id', ctx.userId)
      .eq('name', name)
      .maybeSingle();

    if (existing) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'A programme with this name already exists',
      });
    }

    // Insert programme
    const { data: programme, error } = await supabaseAdmin
      .from('programmes')
      .insert({
        user_id: ctx.userId,
        name, days, weeks, exercises,
      })
      .select()
      .single();

    if (error || !programme) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create programme',
      });
    }

    return programme;
  });
```

**Potential Failure Points:**

1. **Authentication Issue** - User may not be authenticated when mutation is called
2. **tRPC Request Failure** - Request may fail silently (no loading state in UI)
3. **Tunnel Mode** - If using `expo start --tunnel`, API routes don't work (package.json default)
4. **Silent Error Handling** - Error in try-catch may not be displayed properly
5. **Missing Loading State** - No visual feedback during save operation

### Other Documented Issues

1. **Tunnel Mode Warning**: Default `npm run dev` uses `--tunnel` flag, but API routes don't work in tunnel mode

2. **MVP Providers Disabled**: Analytics, Schedule, BodyMetrics, and Leaderboard providers are commented out, limiting feature availability

3. **Supabase Fallback Complexity**: ProgrammeContext has complex fallback logic that may mask underlying issues

4. **Cold Start Delays**: Lazy-loaded Supabase admin client helps but first requests may be slow

---

## Appendix A: File Reference

### Core Entry Points

| File | Purpose |
|------|---------|
| `app/_layout.tsx` | Root layout, provider setup |
| `backend/hono.ts` | Hono server entry |
| `api/trpc/[trpc].ts` | Vercel API handler |
| `lib/trpc.ts` | tRPC client configuration |
| `lib/supabase.ts` | Supabase client (frontend) |
| `backend/lib/auth.ts` | Supabase admin client (backend) |

### Key Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts |
| `vercel.json` | Vercel deployment config |
| `app.json` | Expo app configuration |
| `eas.json` | EAS build profiles |
| `tsconfig.json` | TypeScript configuration |
| `.env.example` | Environment template |

### Context Providers

| File | Purpose |
|------|---------|
| `contexts/UserContext.tsx` | User auth and profile |
| `contexts/ProgrammeContext.tsx` | Programmes and workouts |
| `contexts/ThemeContext.tsx` | App theming |
| `contexts/AnalyticsContext.tsx` | Analytics (MVP: disabled) |
| `contexts/ScheduleContext.tsx` | Schedules (MVP: disabled) |
| `contexts/BodyMetricsContext.tsx` | Body metrics (MVP: disabled) |
| `contexts/LeaderboardContext.tsx` | Leaderboard (MVP: disabled) |

### Database

| File | Purpose |
|------|---------|
| `supabase/schema.sql` | Complete schema export |
| `supabase/migrations/*.sql` | Migration history |
| `supabase/seed_exercises.sql` | Exercise seed data |
| `types/database.ts` | TypeScript type definitions |

---

## Appendix B: Next Audit Phases

**Phase 2 - Deep Dive: Programme Saving Issue**
- Trace complete data flow from button click to database
- Add instrumentation logging
- Test each failure point
- Propose fixes

**Phase 3 - Security Audit**
- Review RLS policies
- Analyze authentication flow
- Check for SQL injection risks
- Validate input sanitization

**Phase 4 - Performance Audit**
- Cold start optimization
- Query performance
- Bundle size analysis
- React Query caching strategy

**Phase 5 - Code Quality Audit**
- TypeScript strictness
- Error handling patterns
- Test coverage
- Dead code identification

---

# PASS 3 - PERFORMANCE & SCALABILITY AUDIT

---

## 10. Performance Audit Summary

### Overall Assessment

| Category | Rating | Severity Count |
|----------|--------|----------------|
| Database Query Efficiency | ⚠️ NEEDS ATTENTION | 2 HIGH, 3 MEDIUM, 2 LOW |
| Frontend Rendering | ✅ GOOD | 1 MEDIUM, 2 LOW |
| API Response Times | ⚠️ NEEDS ATTENTION | 1 HIGH, 2 MEDIUM |
| Caching Strategy | ⚠️ MIXED | 1 HIGH, 1 MEDIUM |
| Scalability (10→10K) | ⚠️ CONCERNS | 3 HIGH, 2 MEDIUM |

### Key Findings

**Strengths:**
- Excellent React hook optimization (useMemo, useCallback, React.memo throughout)
- Good database indexing already in place (2 migration files with indexes)
- Proper use of RPC functions for complex operations (workout logging)
- Well-configured React Query with retry logic and stale times

**Critical Issues:**
- Analytics aggregation has O(n*m) complexity - will not scale
- Exercises endpoint returns ALL exercises with no pagination
- `staleTime: 0` on analytics causes excessive refetching
- Multiple `SELECT *` queries instead of specific columns

---

## 11. Database Query Efficiency

### 11.1 N+1 Query Patterns

**Status:** ✅ MOSTLY GOOD

The codebase generally avoids N+1 patterns through batch queries. Example of good pattern:

**Location:** `backend/trpc/routes/pt/list-clients/route.ts:41-46`

```typescript
// Good: Batch fetch with .in() instead of loop
const clientIds = relationships.map((r) => r.client_id);
const { data: clientProfiles } = await supabaseAdmin
  .from("pt_profile_view")
  .select("id, email, name")
  .in("id", clientIds);
```

**Verified Good Patterns:**
- PT client listing uses Maps for O(1) lookup
- Shared programmes uses relationship joins
- Leaderboard rankings use proper JOINs

### 11.2 Wildcard SELECT Queries

**Severity:** MEDIUM

Multiple routes use `SELECT *` instead of specific columns:

| File | Line | Query | Impact |
|------|------|-------|--------|
| `workouts/history/route.ts` | 17 | `.select('*')` | Returns JSONB exercises column unnecessarily |
| `programmes/list/route.ts` | 9 | `.select('*')` | Returns full exercises JSONB |
| `exercises/list/route.ts` | 9 | `.select('*')` | Returns all exercise columns |
| `pt/list-clients/route.ts` | 24 | `.select("*")` | Returns unnecessary relationship columns |
| `analytics/get/route.ts` | 18 | `.select('*')` | Returns all analytics columns |

**Impact:**
- Increased network transfer (especially JSONB fields)
- Higher memory usage on both client and server
- Slower query execution

**Recommendation:** Replace with specific columns:
```typescript
// Instead of .select('*')
.select('id, name, days, weeks, created_at')
```

### 11.3 Missing Query Limits

**Severity:** HIGH

**Issue 1: Exercises List (Public Endpoint)**

**Location:** `backend/trpc/routes/exercises/list/route.ts:6-21`

```typescript
// Current: No limit, returns ALL exercises
export const listExercisesProcedure = publicProcedure.query(async () => {
  const { data: exercises } = await supabaseAdmin
    .from('exercises')
    .select('*')  // No limit!
    .order('name', { ascending: true });
  return exercises || [];
});
```

**Impact:**
- Exercise library could grow to 500+ exercises
- Every user fetches entire library on app load
- No pagination support

**Issue 2: Workout History (No Default Limit)**

**Location:** `backend/trpc/routes/workouts/history/route.ts:14-27`

```typescript
// Optional limit - defaults to ALL workouts
if (input.limit) {
  query = query.limit(input.limit);
}
// If no limit provided, returns entire workout history!
```

**Impact:** Active users could have 100s of workouts

### 11.4 Database Indexes

**Status:** ✅ GOOD - Comprehensive Indexing

Two migration files provide good coverage:

**File:** `20250115_add_performance_indexes.sql`
```sql
-- Key indexes present:
idx_workouts_user_date ON workouts(user_id, date DESC)
idx_analytics_user_exercise ON analytics(user_id, exercise_id)
idx_leaderboard_stats_volume ON leaderboard_stats(total_volume_kg DESC)
idx_pt_relationships_pt ON pt_client_relationships(pt_id, status)
idx_body_metrics_user_date ON body_metrics(user_id, date DESC)
```

**File:** `20250116_additional_performance_indexes.sql`
```sql
-- Additional composite indexes:
idx_analytics_user_exercise_date ON analytics(user_id, exercise_id, date DESC)
idx_leaderboard_stats_profiles ON leaderboard_stats(user_id) INCLUDE (...)
idx_leaderboard_profiles_opted_in ON leaderboard_profiles WHERE is_opted_in = true
```

**Missing Index (Potential):**
- `programmes(user_id, created_at DESC)` - for listing user programmes

### 11.5 Heavy Computation in Queries

**Severity:** HIGH

**Location:** `backend/trpc/routes/analytics/utils.ts:82-270`

The `aggregateAnalyticsData` function has serious performance issues:

```typescript
// Nested loops - O(months * exercises * data_points)
sortedMonthKeys.forEach((key, index) => {
  // For EACH month...
  Object.values(exerciseData).forEach((exerciseInfo) => {
    // For EACH exercise...
    const currentMonthWeights = exerciseInfo.data
      .filter((d) => d.date.startsWith(key))  // Filter ENTIRE array
      .map((d) => d.weight);
    const previousMonthWeights = exerciseInfo.data
      .filter((d) => d.date.startsWith(previousMonthKey))  // Filter AGAIN
      .map((d) => d.weight);
    // ...calculations
  });
});
```

**Complexity Analysis:**
- 6 months × 50 exercises × 180 data points = 54,000 iterations
- Multiple array.filter() and array.map() allocations per iteration
- Creates new Sets and arrays on every call

**Impact:** Analytics overview could take 1-2 seconds on mobile devices

---

## 12. Frontend Rendering Performance

### 12.1 React.memo Usage

**Status:** ✅ EXCELLENT

All context providers and key components use React.memo:

| Component/Provider | Location | Memoized |
|-------------------|----------|----------|
| `UserProvider` | contexts/UserContext.tsx:297 | ✅ |
| `ProgrammeProvider` | contexts/ProgrammeContext.tsx:335 | ✅ |
| `AnalyticsProvider` | contexts/AnalyticsContext.tsx:162 | ✅ |
| `LeaderboardProvider` | contexts/LeaderboardContext.tsx:372 | ✅ |
| `ExerciseCard` | components/ExerciseCard.tsx:13 | ✅ |
| `ScheduleProvider` | contexts/ScheduleContext.tsx:208 | ✅ |

### 12.2 useMemo/useCallback Optimization

**Status:** ✅ GOOD

**LineChart Component** (`components/LineChart.tsx`):
```typescript
// Proper memoization of expensive SVG calculations
const chartData = useMemo(() => {...}, [data, height, chartWidth]);
const pathD = useMemo(() => {...}, [chartData.points]);
const gradientPath = useMemo(() => {...}, [pathD, chartData.points, height]);
```

**Context Providers** use stable refs to avoid dependency issues:
```typescript
// Good pattern in ProgrammeContext
const createMutationRef = useRef(createMutation);
createMutationRef.current = createMutation;

const addProgramme = useCallback(async (programme) => {
  await createMutationRef.current.mutateAsync({...});
}, []); // Empty deps - ref is stable
```

### 12.3 Unnecessary Re-renders

**Severity:** LOW

**Potential Issue in home.tsx:165-192**

```typescript
// Date formatting inside render loop
{recentWorkouts.map((workout, index) => {
  const workoutDate = new Date(workout.completed_at);
  const formattedDate = workoutDate.toLocaleDateString('en-US', {...});
  // Creates new Date object on every render
})}
```

**Impact:** Minor - only 5 workouts rendered

### 12.4 Image Loading

**Severity:** MEDIUM

**Location:** `components/ExerciseCard.tsx:46-49`

```typescript
// Using basic ImageBackground instead of expo-image
<ImageBackground
  source={{ uri: exercise.thumbnail }}
  style={styles.backgroundImage}
  resizeMode="cover"
>
```

**Issues:**
- No disk caching configured
- No progressive loading
- No placeholder/error states
- No preloading for lists

**Recommendation:** Migrate to `expo-image`:
```typescript
import { Image } from 'expo-image';
<Image
  source={{ uri: exercise.thumbnail }}
  contentFit="cover"
  cachePolicy="disk"
  placeholder={blurhash}
/>
```

### 12.5 Bundle Size Considerations

**Status:** ✅ ACCEPTABLE

**Package.json Analysis:**
- Using modern, optimized packages
- `expo-image` available but underutilized
- No obvious bloat from unused dependencies
- Expo Router provides automatic code splitting

**Large Dependencies:**
- `react-native-reanimated`: ~200KB (necessary for animations)
- `@supabase/supabase-js`: ~150KB (necessary)
- `lucide-react-native`: Tree-shakeable icons

---

## 13. API Response Times

### 13.1 Endpoint Performance Analysis

| Endpoint | Estimated Time | Severity | Issue |
|----------|---------------|----------|-------|
| `exercises.list` | 100-300ms | MEDIUM | No caching, full table scan |
| `analytics.overview` | 500-2000ms | HIGH | Heavy aggregation |
| `leaderboard.getRankings` | 200-500ms | MEDIUM | Two queries (count + data) |
| `workouts.history` | 100-500ms | LOW | Scales with user history |
| `pt.listClients` | 200-400ms | LOW | 3 sequential queries |
| `programmes.list` | 50-150ms | LOW | Simple indexed query |

### 13.2 Slow Endpoints Analysis

**1. Analytics Overview** - HIGH SEVERITY

**Location:** `backend/trpc/routes/analytics/overview/route.ts`

```typescript
// Single RPC call, but heavy aggregation in utils.ts
const { data } = await supabaseAdmin.rpc('get_strength_trend', {
  p_months: months,
});
// Then: aggregateAnalyticsData() with O(n*m) complexity
```

**Bottleneck:** Server-side JavaScript aggregation, not database

**2. Leaderboard Rankings** - MEDIUM SEVERITY

**Location:** `backend/trpc/routes/leaderboard/get-rankings/route.ts`

```typescript
// Two separate queries
const { count } = await countQuery;  // Query 1
const { data } = await query;        // Query 2
```

**Optimization:** Could combine into single query with window functions

**3. PT List Clients** - LOW SEVERITY

**Location:** `backend/trpc/routes/pt/list-clients/route.ts`

```typescript
// Three sequential queries
const { data: ptProfile } = await ...;      // 1. Verify PT
const { data: relationships } = await ...;  // 2. Get relationships
const { data: clientProfiles } = await ...; // 3. Get profiles
const { data: shareRows } = await ...;      // 4. Get shared programmes
```

**Note:** Well-optimized with Maps, but 4 round-trips

### 13.3 Cold Start Impact

**Severity:** MEDIUM

Vercel serverless functions have cold start delays:

**Mitigations Already Present:**
- Lazy-loaded Supabase client (`backend/lib/auth.ts`)
- Lazy-loaded Hono app (`api/trpc/[trpc].ts`)

**Estimated Cold Start:** 500-1500ms (acceptable for serverless)

---

## 14. Caching Strategy Analysis

### 14.1 React Query Configuration

**Location:** `app/_layout.tsx`

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,      // 30 seconds - GOOD
      gcTime: 5 * 60 * 1000,     // 5 minutes - GOOD
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});
```

**Assessment:** ✅ GOOD defaults

### 14.2 Context-Specific Caching

| Context | staleTime | Assessment |
|---------|-----------|------------|
| ProgrammeContext (programmes) | 5 min | ✅ Good |
| ProgrammeContext (history) | 1 min | ✅ Good |
| LeaderboardContext (profile) | 5 min | ✅ Good |
| LeaderboardContext (rankings) | Uses placeholder | ✅ Good |
| **AnalyticsContext** | **0 (zero!)** | ❌ PROBLEM |

### 14.3 Analytics Caching Issue

**Severity:** HIGH

**Location:** `contexts/AnalyticsContext.tsx:50-69`

```typescript
const overviewQuery = trpc.analytics.overview.useQuery(
  { months: 6, programmeDays: activeProgramme?.days ?? 3 },
  {
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
    staleTime: 0,  // ← PROBLEM: Always stale!
  }
);

const volumeQuery = trpc.analytics.getVolume.useQuery(
  { period: volumePeriod },
  {
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
    staleTime: 0,  // ← PROBLEM: Always stale!
  }
);
```

**Impact:**
- Analytics refetched on every mount
- Heavy aggregation runs unnecessarily
- Poor battery/data usage on mobile
- Slow perceived performance

**Recommendation:** Set `staleTime: 2 * 60 * 1000` (2 minutes)

### 14.4 Missing Caching Opportunities

**1. Exercise List (Static Data)**

Exercises rarely change but are fetched fresh every time:
```typescript
// Should add aggressive caching
staleTime: 24 * 60 * 60 * 1000  // 24 hours
```

**2. User Profile**

UserContext uses direct Supabase, bypassing React Query cache entirely.

**3. Image Caching**

No expo-image disk caching configured for exercise thumbnails.

---

## 15. Scalability Assessment: 10 to 10,000 Users

### 15.1 Bottleneck Analysis

| Component | 10 Users | 1,000 Users | 10,000 Users | Severity |
|-----------|----------|-------------|--------------|----------|
| Exercises API | ✅ Fine | ⚠️ Slow | ❌ Critical | HIGH |
| Analytics Aggregation | ✅ Fine | ⚠️ Slow | ❌ Critical | HIGH |
| Leaderboard Rankings | ✅ Fine | ✅ OK | ⚠️ Slow | MEDIUM |
| Workout Logging | ✅ Fine | ✅ Fine | ✅ Fine | LOW |
| Auth/Sessions | ✅ Fine | ✅ Fine | ✅ Fine | LOW |
| Database Connections | ✅ Fine | ⚠️ Watch | ❌ Limit | HIGH |

### 15.2 Critical Scaling Issues

**Issue 1: Exercise Library (PUBLIC, UNLIMITED)**

**Current State:**
- Every user fetches ALL exercises on app load
- No pagination, no limit
- Public endpoint (no auth required)

**At 10,000 Users:**
- 10,000 requests × ~500 exercises × ~1KB each = ~5GB/day transfer
- Database under constant full-table scan pressure

**Required Fix:**
```typescript
.input(z.object({
  limit: z.number().default(50),
  offset: z.number().default(0),
  category: z.string().optional(),
}))
```

**Issue 2: Analytics Aggregation (CPU-BOUND)**

**Current State:**
- Heavy JavaScript processing on every request
- O(months × exercises × records) complexity
- No caching, staleTime: 0

**At 10,000 Users:**
- Each analytics view = 1-2 seconds server compute
- Concurrent requests will exhaust serverless CPU
- Vercel function timeouts likely

**Required Fixes:**
1. Move aggregation to PostgreSQL (use `get_strength_trend` RPC properly)
2. Pre-compute and cache aggregated analytics
3. Set reasonable staleTime (5+ minutes)

**Issue 3: Supabase Connection Limits**

**Current State:**
- Using service role key for all backend operations
- No connection pooling configuration visible

**At 10,000 Users:**
- Supabase free tier: 50 connections
- Pro tier: 100-500 connections
- Concurrent requests could exhaust pool

**Required Fix:**
- Enable Supabase connection pooling (pgBouncer)
- Use transaction pooling mode

### 15.3 Vercel Serverless Scaling

**Current Configuration:**
- Default Vercel limits apply
- No edge functions configured
- Single region deployment

**At Scale Considerations:**
- Cold starts become more frequent under load
- Function execution time limits (10s hobby, 60s pro)
- Concurrent execution limits

### 15.4 Recommended Scaling Roadmap

**Phase 1: Before 500 Users (Immediate)**
| Priority | Action | Effort |
|----------|--------|--------|
| HIGH | Add pagination to exercises endpoint | 1 hour |
| HIGH | Set analytics staleTime to 5 min | 5 min |
| HIGH | Add default limit (50) to workouts.history | 30 min |
| MEDIUM | Replace SELECT * with specific columns | 2 hours |

**Phase 2: Before 2,000 Users**
| Priority | Action | Effort |
|----------|--------|--------|
| HIGH | Move analytics aggregation to PostgreSQL | 1 day |
| HIGH | Enable Supabase connection pooling | 30 min |
| MEDIUM | Add Redis/Upstash caching layer | 1 day |
| MEDIUM | Migrate to expo-image with caching | 2 hours |

**Phase 3: Before 10,000 Users**
| Priority | Action | Effort |
|----------|--------|--------|
| HIGH | Pre-compute analytics on workout completion | 2 days |
| HIGH | Add Vercel Edge for static data | 1 day |
| MEDIUM | Implement database read replicas | 1 day |
| MEDIUM | Add CDN for exercise images | 2 hours |

---

## 16. Performance Issue Summary Table

| Issue | Location | Severity | Fix Effort |
|-------|----------|----------|------------|
| Analytics aggregation O(n*m) | `analytics/utils.ts` | HIGH | 1 day |
| Exercises no pagination | `exercises/list/route.ts` | HIGH | 1 hour |
| Analytics staleTime: 0 | `AnalyticsContext.tsx` | HIGH | 5 min |
| Workout history no default limit | `workouts/history/route.ts` | MEDIUM | 30 min |
| SELECT * queries (5 instances) | Multiple routes | MEDIUM | 2 hours |
| ImageBackground vs expo-image | `ExerciseCard.tsx` | MEDIUM | 2 hours |
| Leaderboard 2 queries | `get-rankings/route.ts` | LOW | 1 hour |
| PT clients 4 queries | `list-clients/route.ts` | LOW | 2 hours |
| Date formatting in render | `home.tsx` | LOW | 30 min |

---

## Appendix C: Performance Monitoring Recommendations

### Recommended Tools

1. **Sentry Performance** (Already integrated)
   - Enable transaction tracing
   - Set up slow query alerts

2. **Supabase Dashboard**
   - Monitor query performance
   - Watch connection usage
   - Enable slow query logging

3. **Vercel Analytics**
   - Function duration monitoring
   - Cold start frequency
   - Error rate tracking

### Key Metrics to Track

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| API p95 latency | < 500ms | > 1000ms |
| Cold start rate | < 10% | > 25% |
| Database connections | < 50% | > 80% |
| Analytics API time | < 1s | > 2s |
| Bundle size | < 5MB | > 8MB |

---

*End of Performance Audit - Pass 3*

---

# PASS 4 - CODE QUALITY & MAINTAINABILITY AUDIT

---

## 17. Code Quality Summary

### Overall Assessment

| Category | Rating | Issue Count |
|----------|--------|-------------|
| TypeScript Usage | ⚠️ NEEDS ATTENTION | 77+ `any` usages |
| Error Handling | ✅ GOOD | Consistent patterns |
| Code Duplication | ❌ CRITICAL | Entire duplicate directory |
| Test Coverage | ⚠️ MINIMAL | Only 3 test files |
| Dead Code | ⚠️ NEEDS CLEANUP | Duplicate `projects/` folder |
| Naming Conventions | ✅ GOOD | Consistent patterns |

### Key Findings

**Critical Issues:**
1. **Duplicate codebase** in `projects/4d44d50b-a59d-4dd3-9519-4d00e3780829/` - 38 duplicate files
2. **77+ instances of `any` type** - reduces type safety
3. **Minimal test coverage** - only 3 test files for entire app

**Good Practices Found:**
- Consistent naming conventions (camelCase for app, snake_case for DB)
- Proper error handling with logging in all catch blocks
- ESLint configured with strict rules
- TypeScript strict mode enabled

---

## 18. TypeScript Usage & Type Safety

### 18.1 `any` Type Usage

**Total Instances Found:** 77+

**Severity:** MEDIUM - Reduces type safety benefits

#### Category Breakdown

| Category | Count | Files Affected |
|----------|-------|----------------|
| Router navigation | 11 | Various `app/*.tsx` |
| Error handling | 12 | Contexts, services |
| `__DEV__` checks | 7 | lib/, services/, backend/ |
| Supabase client hacks | 4 | `lib/supabase.ts`, `lib/trpc.ts` |
| Logger implementation | 8 | `lib/logger.ts` |
| Component props | 6 | `home.tsx`, modals |
| Backend routes | 5 | schedules, leaderboard |
| Test mocks | 10 | `tests/*.ts` |
| Other | 14 | Various |

#### Most Problematic Files

**1. Router Navigation - `as any` pattern (11 instances)**

```typescript
// Pattern found throughout app/
router.push(`/programme/${id}` as any)
router.replace('/auth' as any)
```

**Files affected:**
- `app/(tabs)/home.tsx:22,62,131`
- `app/(tabs)/workouts.tsx:88`
- `app/client/my-pt.tsx:72,122`
- `app/create-programme/index.tsx:123`
- `app/pt/clients.tsx:221`
- `app/programme/[id].tsx:392`
- `components/ExerciseCard.tsx:34`
- `app/(tabs)/_layout.tsx:18`

**Root Cause:** Expo Router's type definitions don't recognize dynamic routes

**2. `__DEV__` Global Check (7 instances)**

```typescript
// Pattern repeated in multiple files
const dev = (global as any).__DEV__;
```

**Files:**
- `lib/logger.ts:20`
- `lib/trpc.ts:35`
- `backend/hono.ts:38`
- `services/error.service.ts:32,145`
- `components/ErrorBoundary.tsx:67`

**Root Cause:** React Native's `__DEV__` global not typed

**3. Error Catch Blocks (12 instances)**

```typescript
// Pattern in catch blocks
} catch (error: any) {
  const message = error.message;
}
```

**Files:**
- `contexts/UserContext.tsx:180,215,249`
- `contexts/LeaderboardContext.tsx:292,305`
- `app/edit-profile.tsx:137`
- `app/pt/clients.tsx:38,57,161,185`
- `app/pt/client/[id].tsx:54,77`

**4. Logger Implementation (8 instances)**

**Location:** `lib/logger.ts`

```typescript
function sanitize(data: any): any {...}
private formatMessage(args: any[]): { message: string; data?: any }
debug(...args: any[]) {...}
```

**Justification:** Logger intentionally accepts any data type - acceptable

### 18.2 TypeScript Configuration

**Location:** `tsconfig.json`

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": { "@/*": ["./*"] }
  }
}
```

**Assessment:** ✅ GOOD - Strict mode enabled

### 18.3 Recommendations

| Priority | Action | Effort |
|----------|--------|--------|
| HIGH | Create typed route helper for Expo Router | 2 hours |
| HIGH | Add `isDev()` utility function | 30 min |
| MEDIUM | Type error catch blocks with `unknown` | 2 hours |
| LOW | Accept `any` in logger (intentional) | N/A |

---

## 19. Error Handling Patterns

### 19.1 Overall Assessment

**Status:** ✅ GOOD

All catch blocks contain error handling. No empty catch blocks found.

### 19.2 Patterns Observed

**Pattern 1: Log and Re-throw (Backend)**

```typescript
// Good pattern in backend routes
} catch (error) {
  logger.error('[Module] Error description:', error);
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'User-friendly message',
  });
}
```

**Files using this pattern:**
- All files in `backend/trpc/routes/`

**Pattern 2: Log and Set State (Frontend)**

```typescript
// Good pattern in contexts
} catch (error) {
  logger.error('[Context] Error:', error);
  setError('User-friendly message');
  // OR
  throw error; // Propagate to caller
}
```

**Files using this pattern:**
- `contexts/BodyMetricsContext.tsx:99,118`
- `contexts/LeaderboardContext.tsx:154,200,205,240,272`

**Pattern 3: Alert User (Screens)**

```typescript
// Good pattern in screens
} catch (error) {
  Alert.alert('Error', 'Something went wrong. Please try again.');
}
```

**Files:**
- `app/auth.tsx:62`

### 19.3 Error Logging

**Logger Usage:** ✅ CONSISTENT

All error handling uses `logger.error()` from `lib/logger.ts`

**Exception:** 2 files still use `console.error`:
- `contexts/ScheduleContext.tsx:66` - Uses `console.log`
- `components/ExerciseSelectorModal.tsx:50` - Uses `console.error`

### 19.4 TRPCError Usage

**Status:** ✅ CORRECT

Backend routes properly use TRPCError with appropriate codes:
- `UNAUTHORIZED` - Auth failures
- `FORBIDDEN` - Permission failures
- `BAD_REQUEST` - Validation failures
- `NOT_FOUND` - Resource not found
- `INTERNAL_SERVER_ERROR` - Database errors

---

## 20. Code Duplication Analysis

### 20.1 Critical Issue: Duplicate Directory

**Severity:** ❌ CRITICAL

**Location:** `projects/4d44d50b-a59d-4dd3-9519-4d00e3780829/`

**Description:** A complete duplicate of the backend codebase exists in the `projects/` directory with 38 duplicate files.

**Files duplicated:**
```
projects/.../backend/
├── hono.ts
├── lib/auth.ts
└── trpc/
    ├── app-router.ts
    ├── create-context.ts
    └── routes/
        ├── analytics/ (3 files)
        ├── auth/ (1 file)
        ├── body-metrics/ (4 files)
        ├── clients/ (2 files)
        ├── example/ (1 file)
        ├── personal-records/ (2 files)
        ├── profile/ (2 files)
        ├── programmes/ (4 files)
        ├── pt/ (10 files)
        ├── schedules/ (3 files)
        └── workouts/ (2 files)
```

**Impact:**
- Confusion about which code is active
- Duplicate console.log statements (30+ in projects/ folder)
- Maintenance burden
- Git history pollution

**Recommendation:** DELETE `projects/` directory immediately

### 20.2 Repeated Patterns (Acceptable)

**Pattern: isDev Check**

```typescript
const dev = (global as any).__DEV__;
```

**Found in 7 files** - Should be extracted to utility

**Pattern: Error Message Extraction**

```typescript
const message = error instanceof Error ? error.message : 'Unknown error';
```

**Found in 10+ files** - Could use shared utility

### 20.3 Router Navigation Duplication

**Pattern:** `router.push(\`...\` as any)`

**Found in 11 files** - Should use typed navigation helper

---

## 21. Test Coverage Assessment

### 21.1 Test Files Found

| File | Type | Coverage |
|------|------|----------|
| `tests/analytics-overview.test.ts` | Unit | `aggregateAnalyticsData` function |
| `tests/pt-workflow.test.ts` | Integration | PT invite/accept/share flow |
| `tests/e2e/smoke.spec.ts` | E2E (Playwright) | Landing page only |

**Total Test Files:** 3 (excluding node_modules)

### 21.2 Coverage Analysis

**What's Tested:**
- ✅ Analytics aggregation logic
- ✅ PT workflow (invite → accept → share)
- ✅ Basic page load (E2E)

**What's NOT Tested:**
- ❌ Authentication flows (signup, signin, signout)
- ❌ Programme creation/editing
- ❌ Workout logging
- ❌ User profile updates
- ❌ Body metrics
- ❌ Schedule management
- ❌ Leaderboard functionality
- ❌ All UI components
- ❌ Context providers
- ❌ Error boundary
- ❌ API error handling
- ❌ Offline behavior

### 21.3 Test Infrastructure

**Unit Testing:** Vitest ✅ Configured

```typescript
// vitest.config.ts exists with proper setup
```

**E2E Testing:** Playwright ✅ Configured

```typescript
// playwright.config.ts exists
```

**Test Setup:** ✅ Proper mocks in `tests/setup/vitest.setup.ts`

### 21.4 Coverage Estimate

| Area | Estimated Coverage |
|------|-------------------|
| Backend Routes | ~5% (1 integration test) |
| Contexts | 0% |
| Components | 0% |
| Screens | 0% |
| Utilities | ~10% |
| **Overall** | **~2-3%** |

### 21.5 Recommendations

| Priority | Action | Effort |
|----------|--------|--------|
| HIGH | Add auth flow tests | 1 day |
| HIGH | Add programme CRUD tests | 1 day |
| MEDIUM | Add component tests | 2 days |
| MEDIUM | Add context tests | 1 day |
| LOW | Increase E2E coverage | 2 days |

---

## 22. Dead Code & Unused Dependencies

### 22.1 Dead Code Found

**1. Duplicate Projects Directory**

**Location:** `projects/4d44d50b-a59d-4dd3-9519-4d00e3780829/`
**Size:** 38 files
**Action:** DELETE

**2. Console Statements in Production Code**

| File | Line | Statement |
|------|------|-----------|
| `contexts/ScheduleContext.tsx` | 66 | `console.log()` |
| `components/ExerciseSelectorModal.tsx` | 50 | `console.error()` |

**Action:** Replace with `logger.*`

### 22.2 Commented-Out Code

**MVP Providers (Intentional)**

```typescript
// app/_layout.tsx
{/* MVP: Commented out providers */}
{/* <AnalyticsProvider> */}
{/* <ScheduleProvider> */}
{/* <BodyMetricsProvider> */}
{/* <LeaderboardProvider> */}
```

**Status:** Intentional - Coming Soon features

### 22.3 Package.json Analysis

**Potentially Unused Dependencies:**

| Package | Usage Found | Action |
|---------|-------------|--------|
| `@ai-sdk/react` | Not found in codebase | INVESTIGATE |
| `expo-location` | Not found in components | INVESTIGATE |
| `expo-sharing` | Not found in components | INVESTIGATE |

**Used but Underutilized:**

| Package | Current Usage | Potential |
|---------|---------------|-----------|
| `expo-image` | Not used | Should replace ImageBackground |
| `zustand` | Listed but React Context used | Consider migration |

### 22.4 Recommendations

| Priority | Action | Effort |
|----------|--------|--------|
| CRITICAL | Delete `projects/` directory | 5 min |
| HIGH | Audit unused npm packages | 1 hour |
| MEDIUM | Replace console.* with logger | 15 min |
| LOW | Consider Zustand migration | 1 day |

---

## 23. Naming Conventions & Consistency

### 23.1 Overall Assessment

**Status:** ✅ GOOD

### 23.2 File Naming

| Pattern | Convention | Status |
|---------|------------|--------|
| React components | PascalCase | ✅ `ExerciseCard.tsx` |
| Screens | kebab-case | ✅ `my-pt.tsx` |
| Contexts | PascalCase | ✅ `UserContext.tsx` |
| Hooks | camelCase | ✅ `useExercises.ts` |
| Utils/lib | camelCase | ✅ `logger.ts` |
| Backend routes | kebab-case | ✅ `list-clients/route.ts` |
| Types | camelCase | ✅ `database.ts` |

### 23.3 Code Naming

| Pattern | Convention | Status |
|---------|------------|--------|
| Variables | camelCase | ✅ `const userId` |
| Functions | camelCase | ✅ `handleSave()` |
| Constants | SCREAMING_SNAKE | ✅ `TIMEOUT_CONFIG` |
| Types/Interfaces | PascalCase | ✅ `type UserProfile` |
| Database fields | snake_case | ✅ (intentional) |

### 23.4 Database to App Mapping

**Pattern:** Explicit mapping between snake_case (DB) and camelCase (App)

```typescript
// types/database.ts - Documents the pattern
/**
 * Database types - Column names use snake_case
 * Application code should use camelCase versions
 * Mapping happens in contexts and tRPC routes
 */
```

**Implementation locations:**
- `contexts/UserContext.tsx:233` - Profile mapping
- `backend/trpc/routes/` - All routes handle mapping

### 23.5 Inconsistencies Found

**1. Mixed Router Type Assertion**

Some files use:
```typescript
router.push('/path' as any)
```
Others use:
```typescript
router.push(`/path/${id}` as any)
```

**Recommendation:** Create typed navigation helper

**2. Logger vs Console**

Most code uses `logger.*` but 2 files use `console.*`

---

## 24. Code Quality Issue Summary Table

| Issue | Location | Severity | Fix Effort |
|-------|----------|----------|------------|
| Duplicate `projects/` directory | `projects/` | CRITICAL | 5 min |
| 77+ `any` type usages | Throughout | MEDIUM | 4 hours |
| Router `as any` pattern | 11 files | MEDIUM | 2 hours |
| `__DEV__` duplication | 7 files | LOW | 30 min |
| console.* instead of logger | 2 files | LOW | 15 min |
| Minimal test coverage (~3%) | `tests/` | HIGH | 5+ days |
| Unused dependencies | `package.json` | LOW | 1 hour |

---

## Appendix D: ESLint Configuration

**Location:** `eslint.config.js`

**Key Rules:**
```javascript
{
  "import/order": "error",        // ✅ Enforced
  "no-console": ["error", {
    allow: ["warn", "error", "info"]
  }],                              // ✅ Enforced (mostly)
  "react-hooks/rules-of-hooks": "error",
  "react-hooks/exhaustive-deps": "error",
}
```

**Ignored Paths:**
- `dist/*`
- `supabase/migrations/**`
- NOT ignoring `projects/` (should add)

---

## Appendix E: Quick Fixes Checklist

### Immediate (< 1 hour)

- [ ] Delete `projects/4d44d50b-a59d-4dd3-9519-4d00e3780829/` directory
- [ ] Replace console.log in `ScheduleContext.tsx:66`
- [ ] Replace console.error in `ExerciseSelectorModal.tsx:50`
- [ ] Add `projects/` to `.gitignore`
- [ ] Add `projects/` to `eslint.config.js` ignores

### Short-term (1 day)

- [ ] Create `lib/isDev.ts` utility for `__DEV__` checks
- [ ] Create typed navigation helper for Expo Router
- [ ] Audit and remove unused npm packages
- [ ] Type error catch blocks with `unknown` instead of `any`

### Medium-term (1 week)

- [ ] Add authentication flow tests
- [ ] Add programme CRUD tests
- [ ] Replace remaining `any` types with proper types
- [ ] Migrate from ImageBackground to expo-image

---

*End of Code Quality Audit - Pass 4*

---

# PASS 5 - RECOMMENDATIONS & ROADMAP

---

## 25. Top 10 Critical Fixes (Before Going Live)

These must be addressed before public App Store release.

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| **1** | **Delete duplicate `projects/` directory** | `projects/4d44d50b-...` | 38 duplicate files causing confusion, potential code sync issues | **SMALL** (5 min) |
| **2** | **Fix Programme Saving Issue** | `app/create-programme/review.tsx`, `contexts/ProgrammeContext.tsx` | Core feature broken - users cannot save programmes | **MEDIUM** (2-4 hours) |
| **3** | **Add pagination to exercises endpoint** | `backend/trpc/routes/exercises/list/route.ts` | Unbounded data fetch; will crash with large exercise library | **SMALL** (1 hour) |
| **4** | **Set analytics staleTime to 5 minutes** | `contexts/AnalyticsContext.tsx:50-69` | `staleTime: 0` causes excessive refetching, poor battery/performance | **SMALL** (5 min) |
| **5** | **Add default limit to workout history** | `backend/trpc/routes/workouts/history/route.ts` | No limit returns entire history; grows unbounded | **SMALL** (30 min) |
| **6** | **Replace SELECT * with specific columns** | 5 backend routes | Unnecessary data transfer, especially JSONB fields | **SMALL** (2 hours) |
| **7** | **Remove tunnel mode as default** | `package.json` scripts | API routes don't work in tunnel mode | **SMALL** (5 min) |
| **8** | **Replace console.* with logger** | `ScheduleContext.tsx:66`, `ExerciseSelectorModal.tsx:50` | ESLint violation, inconsistent error handling | **SMALL** (15 min) |
| **9** | **Add loading state to programme save** | `app/create-programme/review.tsx` | No visual feedback during save operation | **SMALL** (30 min) |
| **10** | **Verify Supabase RLS policies for production** | `supabase/schema.sql`, migrations | Ensure proper access control for multi-tenant data | **MEDIUM** (2-3 hours) |

### Critical Fix Details

#### Fix 1: Delete Duplicate Directory
```bash
# From project root
rm -rf projects/
echo "projects/" >> .gitignore
```

#### Fix 2: Programme Saving Issue Investigation
The save handler in `review.tsx` calls `addProgramme()` which uses tRPC. Potential issues:
1. No loading state - user doesn't know if it's working
2. Silent error handling - errors may not display
3. Tunnel mode - if using `--tunnel`, API routes fail

**Recommended Debugging Steps:**
1. Add `console.log` before/after `addProgramme` call
2. Add loading state with `setIsSaving(true/false)`
3. Wrap in try-catch with `Alert.alert` for errors
4. Test without tunnel mode: `npx expo start` (not `--tunnel`)

#### Fix 4: Analytics staleTime
```typescript
// contexts/AnalyticsContext.tsx
const overviewQuery = trpc.analytics.overview.useQuery(
  { months: 6, programmeDays: activeProgramme?.days ?? 3 },
  {
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,  // 5 minutes instead of 0
  }
);
```

#### Fix 7: Remove Tunnel Mode Default
```json
// package.json - change this:
"dev": "expo start --tunnel"
// to this:
"dev": "expo start",
"dev:tunnel": "expo start --tunnel"
```

---

## 26. Top 10 Improvements (Quality & User Experience)

These significantly improve app quality and should be done soon after launch.

| # | Improvement | Location | Impact | Effort |
|---|-------------|----------|--------|--------|
| **1** | **Move analytics aggregation to PostgreSQL** | `backend/trpc/routes/analytics/utils.ts` | Eliminates O(n*m) JS computation; 10x faster | **LARGE** (1-2 days) |
| **2** | **Migrate to expo-image for thumbnails** | `components/ExerciseCard.tsx` | Disk caching, progressive loading, placeholders | **MEDIUM** (2-3 hours) |
| **3** | **Create typed navigation helper** | `lib/navigation.ts` (new) | Eliminates 11 `as any` casts, better DX | **MEDIUM** (2-3 hours) |
| **4** | **Add authentication flow tests** | `tests/auth.test.ts` (new) | Critical path coverage, catch regressions | **LARGE** (1 day) |
| **5** | **Add programme CRUD tests** | `tests/programmes.test.ts` (new) | Catch the "save doesn't work" issue earlier | **LARGE** (1 day) |
| **6** | **Create isDev utility function** | `lib/isDev.ts` (new) | Eliminates 7 duplicated `__DEV__` checks | **SMALL** (30 min) |
| **7** | **Type error catch blocks** | Throughout codebase | Replace `error: any` with `error: unknown` | **MEDIUM** (2-3 hours) |
| **8** | **Add exercise library caching** | tRPC client config | 24-hour staleTime for static data | **SMALL** (30 min) |
| **9** | **Enable Sentry performance monitoring** | `services/error.service.ts` | Transaction tracing for slow requests | **MEDIUM** (2-3 hours) |
| **10** | **Add offline-first capability** | Contexts, React Query | Queue mutations when offline | **LARGE** (3-5 days) |

### Improvement Details

#### Improvement 1: Move Analytics to PostgreSQL

Current problem: Analytics aggregation happens in JavaScript with O(n×m) complexity.

**Solution:** Create a PostgreSQL function:
```sql
CREATE OR REPLACE FUNCTION calculate_analytics_overview(
  p_user_id UUID,
  p_months INT DEFAULT 6
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Aggregate in database instead of JavaScript
  SELECT json_build_object(
    'monthlyVolume', (
      SELECT json_agg(...)
      FROM analytics
      WHERE user_id = p_user_id
      GROUP BY DATE_TRUNC('month', date)
    ),
    -- ... other aggregations
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

#### Improvement 3: Typed Navigation Helper

```typescript
// lib/navigation.ts
import { router } from 'expo-router';

type AppRoutes = {
  home: undefined;
  'programme/[id]': { id: string };
  'session/[id]': { id: string };
  // ... all routes
};

export function navigate<T extends keyof AppRoutes>(
  route: T,
  params?: AppRoutes[T]
) {
  if (params) {
    const path = route.replace(/\[(\w+)\]/g, (_, key) => params[key]);
    router.push(path as any);
  } else {
    router.push(route as any);
  }
}

// Usage:
navigate('programme/[id]', { id: programmeId });
```

#### Improvement 6: isDev Utility

```typescript
// lib/isDev.ts
declare const __DEV__: boolean | undefined;

export function isDev(): boolean {
  if (typeof __DEV__ !== 'undefined') return __DEV__;
  return process.env.NODE_ENV === 'development';
}
```

---

## 27. Architecture Recommendations for Analytics & Leaderboard

### 27.1 Analytics Feature Architecture

**Current State:** Analytics providers are commented out; `aggregateAnalyticsData` has performance issues.

#### Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ANALYTICS SYSTEM                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │   Workout Log   │───>│  Analytics      │───>│ Pre-computed    │ │
│  │   (Trigger)     │    │  Update Job     │    │ Aggregates      │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘ │
│                                                         │           │
│                                                         ▼           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    analytics_summary (new table)             │   │
│  │  ┌──────────────────────────────────────────────────────┐   │   │
│  │  │ user_id | month | total_volume | session_count | ... │   │   │
│  │  └──────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                         │           │
│                                                         ▼           │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │  React Query    │<───│  tRPC Query     │<───│   Fast Read     │ │
│  │  (5 min cache)  │    │  (overview)     │    │   (pre-computed)│ │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### Implementation Steps

**Step 1: Create Summary Table**
```sql
CREATE TABLE analytics_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- First day of month
  total_volume_kg DECIMAL(12,2) DEFAULT 0,
  total_sessions INT DEFAULT 0,
  total_sets INT DEFAULT 0,
  unique_exercises INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

CREATE INDEX idx_analytics_summary_user_month
  ON analytics_summary(user_id, month DESC);
```

**Step 2: Create Update Trigger**
```sql
CREATE OR REPLACE FUNCTION update_analytics_summary()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO analytics_summary (user_id, month, total_volume_kg, ...)
  VALUES (
    NEW.user_id,
    DATE_TRUNC('month', NEW.completed_at),
    -- calculate from NEW.exercises JSONB
  )
  ON CONFLICT (user_id, month) DO UPDATE SET
    total_volume_kg = analytics_summary.total_volume_kg + EXCLUDED.total_volume_kg,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_workout_analytics
AFTER INSERT ON workouts
FOR EACH ROW EXECUTE FUNCTION update_analytics_summary();
```

**Step 3: Simplify Overview Query**
```typescript
// backend/trpc/routes/analytics/overview/route.ts
export const overviewProcedure = protectedProcedure
  .input(z.object({ months: z.number().default(6) }))
  .query(async ({ ctx, input }) => {
    const { data } = await supabaseAdmin
      .from('analytics_summary')
      .select('month, total_volume_kg, total_sessions, unique_exercises')
      .eq('user_id', ctx.userId)
      .gte('month', subMonths(new Date(), input.months))
      .order('month', { ascending: true });

    return data; // Pre-computed, no JS aggregation needed
  });
```

### 27.2 Leaderboard Feature Architecture

**Current State:** Good database design with `leaderboard_profiles` and `leaderboard_stats`.

#### Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                       LEADERBOARD SYSTEM                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐         ┌─────────────────┐                    │
│  │   User Opts In  │────────>│ leaderboard_    │                    │
│  │   (one-time)    │         │ profiles        │                    │
│  └─────────────────┘         └─────────────────┘                    │
│                                      │                               │
│                                      ▼                               │
│  ┌─────────────────┐         ┌─────────────────┐                    │
│  │ Workout Logged  │────────>│ Ranking Update  │                    │
│  │ (trigger)       │         │ (async job)     │                    │
│  └─────────────────┘         └─────────────────┘                    │
│                                      │                               │
│                                      ▼                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    leaderboard_stats                          │   │
│  │  ┌──────────────────────────────────────────────────────┐   │   │
│  │  │ user_id | total_volume | monthly_volume | *_rank     │   │   │
│  │  └──────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                      │                               │
│                                      ▼                               │
│  ┌─────────────────┐         ┌─────────────────┐                    │
│  │  Leaderboard    │<────────│  Cached Query   │                    │
│  │  Screen         │         │  (2 min cache)  │                    │
│  └─────────────────┘         └─────────────────┘                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### Key Recommendations

1. **Use MATERIALIZED VIEW for Rankings**
```sql
CREATE MATERIALIZED VIEW leaderboard_rankings AS
SELECT
  ls.user_id,
  lp.display_name,
  ls.total_volume_kg,
  RANK() OVER (ORDER BY ls.total_volume_kg DESC) as total_rank,
  RANK() OVER (ORDER BY ls.monthly_volume_kg DESC) as monthly_rank
FROM leaderboard_stats ls
JOIN leaderboard_profiles lp ON ls.user_id = lp.user_id
WHERE lp.is_opted_in = true;

-- Refresh every 5 minutes via cron
REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_rankings;
```

2. **Add Caching to Rankings Query**
```typescript
// contexts/LeaderboardContext.tsx
const rankingsQuery = trpc.leaderboard.getRankings.useQuery(
  { category, limit: 50 },
  {
    staleTime: 2 * 60 * 1000,  // 2 minutes
    gcTime: 10 * 60 * 1000,    // 10 minutes
  }
);
```

3. **Gender-Based Leaderboards**
```sql
-- Already supported in schema via leaderboard_profiles.gender
-- Just add filter parameter to query
WHERE lp.gender = p_gender OR p_gender IS NULL
```

### 27.3 Shared Recommendations

| Recommendation | Analytics | Leaderboard | Effort |
|----------------|-----------|-------------|--------|
| Pre-compute aggregates on write | ✅ Essential | ✅ Essential | MEDIUM |
| Use PostgreSQL functions | ✅ Essential | ✅ Helpful | MEDIUM |
| Cache at React Query level | ✅ Essential | ✅ Essential | SMALL |
| Use materialized views | Optional | ✅ Essential | MEDIUM |
| Add refresh cron job | Optional | ✅ Essential | SMALL |
| Consider Supabase Edge Functions | Future | Future | LARGE |

---

## 28. Deployment Checklist (TestFlight to App Store)

### 28.1 Pre-Submission Checklist

#### Code Quality ✅
- [ ] Delete `projects/` duplicate directory
- [ ] Fix all critical issues from Section 25
- [ ] Run `npm run lint` with no errors
- [ ] Run `npm run typecheck` with no errors
- [ ] All `console.log` removed or replaced with logger

#### Testing ✅
- [ ] Test auth flow (signup, signin, signout) on physical device
- [ ] Test programme creation and saving
- [ ] Test workout logging and completion
- [ ] Test on both iOS and Android
- [ ] Test on different screen sizes
- [ ] Test offline behavior (graceful degradation)
- [ ] Test deep links if implemented

#### Security ✅
- [ ] Verify all Supabase RLS policies
- [ ] Ensure no API keys in client bundle
- [ ] Verify HTTPS for all API calls
- [ ] Review JWT token handling
- [ ] Test authentication edge cases

#### Performance ✅
- [ ] Analytics loads in < 2 seconds
- [ ] Exercise list loads in < 1 second
- [ ] No UI jank during navigation
- [ ] Images load with placeholders
- [ ] Cold start < 3 seconds

### 28.2 App Store Assets Required

| Asset | iOS Requirement | Android Requirement |
|-------|-----------------|---------------------|
| App Icon | 1024x1024 PNG (no alpha) | 512x512 PNG |
| Screenshots | 6.7", 6.5", 5.5" iPhones | Phone, 7" tablet, 10" tablet |
| App Preview Video | Optional (15-30 sec) | Optional |
| Privacy Policy URL | Required | Required |
| Terms of Service URL | Required | Recommended |
| Support URL | Required | Required |
| App Description | 4000 chars max | 4000 chars max |
| Keywords | 100 chars (iOS only) | N/A |

### 28.3 App Store Configuration

#### iOS (App Store Connect)

1. **App Information**
   - [ ] Primary Category: Health & Fitness
   - [ ] Secondary Category: Lifestyle (optional)
   - [ ] Age Rating: 4+ (no objectionable content)
   - [ ] Privacy Policy URL configured

2. **Pricing and Availability**
   - [ ] Price: Free / Subscription configured
   - [ ] Territories: Select countries
   - [ ] Pre-order: Optional

3. **App Privacy (Required)**
   - [ ] Data types collected: Account info, Health/Fitness
   - [ ] Data linked to user: Email, workout data
   - [ ] Data used for tracking: None (or specify)

4. **In-App Purchases** (if applicable)
   - [ ] Configure subscription products
   - [ ] Set up subscription groups
   - [ ] Configure pricing by region

#### Android (Google Play Console)

1. **Store Listing**
   - [ ] Short description (80 chars)
   - [ ] Full description (4000 chars)
   - [ ] Graphics assets uploaded

2. **App Content**
   - [ ] Privacy Policy URL
   - [ ] App Access (test credentials if needed)
   - [ ] Content Rating questionnaire
   - [ ] Target Audience: 18+ (fitness content)

3. **Data Safety**
   - [ ] Complete data collection disclosure
   - [ ] Specify security practices

### 28.4 Environment Configuration

#### Production Environment Variables

**Vercel (Backend):**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key
NODE_ENV=production
```

**Expo (Mobile App):**
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_RORK_API_BASE_URL=https://your-vercel-app.vercel.app
```

### 28.5 EAS Build Commands

```bash
# Preview build (for testing)
eas build --platform ios --profile preview
eas build --platform android --profile preview

# Production build (for App Store)
eas build --platform ios --profile production
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### 28.6 Post-Launch Monitoring

| Metric | Tool | Alert Threshold |
|--------|------|-----------------|
| Crash-free rate | Sentry | < 99% |
| API error rate | Vercel Analytics | > 1% |
| Cold start time | Vercel | > 2 seconds |
| User signups | Supabase Dashboard | - |
| Active sessions | Supabase Dashboard | - |
| Database connections | Supabase | > 80% |

### 28.7 Launch Day Checklist

**Morning of Launch:**
- [ ] Verify all production environment variables
- [ ] Check Supabase dashboard (RLS, connections)
- [ ] Check Vercel dashboard (function health)
- [ ] Test fresh install flow on device
- [ ] Verify app appears in store listings

**Post-Launch (First 24 hours):**
- [ ] Monitor Sentry for crashes
- [ ] Monitor Vercel for API errors
- [ ] Respond to any user reviews
- [ ] Check database performance
- [ ] Monitor auth success rate

---

## 29. Summary & Priority Matrix

### Immediate Actions (Before App Store Submit)

| Priority | Task | Effort | Section |
|----------|------|--------|---------|
| 🔴 P0 | Delete `projects/` directory | 5 min | 25.1 |
| 🔴 P0 | Fix programme saving issue | 2-4 hours | 25.2 |
| 🔴 P0 | Set analytics staleTime | 5 min | 25.4 |
| 🔴 P0 | Remove tunnel mode default | 5 min | 25.7 |
| 🟡 P1 | Add exercises pagination | 1 hour | 25.3 |
| 🟡 P1 | Add workout history limit | 30 min | 25.5 |
| 🟡 P1 | Replace SELECT * queries | 2 hours | 25.6 |
| 🟡 P1 | Replace console.* | 15 min | 25.8 |
| 🟡 P1 | Add save loading state | 30 min | 25.9 |
| 🟡 P1 | Verify RLS policies | 2-3 hours | 25.10 |

### Post-Launch Improvements (First Month)

| Priority | Task | Effort | Section |
|----------|------|--------|---------|
| 🟡 P1 | Move analytics to PostgreSQL | 1-2 days | 26.1 |
| 🟡 P1 | Add authentication tests | 1 day | 26.4 |
| 🟡 P1 | Add programme tests | 1 day | 26.5 |
| 🟢 P2 | Migrate to expo-image | 2-3 hours | 26.2 |
| 🟢 P2 | Create typed navigation | 2-3 hours | 26.3 |
| 🟢 P2 | Enable Sentry performance | 2-3 hours | 26.9 |

### Scaling Roadmap

| Milestone | Actions Required |
|-----------|------------------|
| 500 users | All P0 and P1 fixes complete |
| 2,000 users | Analytics in PostgreSQL, connection pooling enabled |
| 5,000 users | Redis caching layer, materialized views for leaderboard |
| 10,000 users | Read replicas, CDN for images, edge functions |

---

## Appendix F: Quick Reference

### Key File Locations

| Purpose | File |
|---------|------|
| Programme save handler | `app/create-programme/review.tsx` |
| Programme context | `contexts/ProgrammeContext.tsx` |
| Analytics context | `contexts/AnalyticsContext.tsx` |
| Analytics aggregation | `backend/trpc/routes/analytics/utils.ts` |
| Exercises endpoint | `backend/trpc/routes/exercises/list/route.ts` |
| Workout history | `backend/trpc/routes/workouts/history/route.ts` |
| React Query config | `app/_layout.tsx` |
| tRPC client | `lib/trpc.ts` |
| ESLint config | `eslint.config.js` |
| EAS build config | `eas.json` |

### Command Reference

```bash
# Development
npm run dev          # Start Expo (local)
npm run dev:tunnel   # Start Expo with tunnel

# Building
eas build --profile preview      # TestFlight build
eas build --profile production   # App Store build

# Testing
npm test             # Run Vitest
npm run test:e2e     # Run Playwright

# Linting
npm run lint         # ESLint check
npm run typecheck    # TypeScript check

# Database
supabase db push     # Push migrations
supabase db reset    # Reset local DB
```

---

*End of Recommendations & Roadmap - Pass 5*

---

# AUDIT COMPLETE

**Total Issues Identified:** 25+ across 5 passes

**Critical Count:** 10 (must fix before launch)
**High Priority:** 10 (should fix within first month)
**Medium Priority:** 10+ (quality improvements)

**Estimated Total Effort for P0 + P1 Fixes:** 2-3 days of focused work

---

*Audit completed by Claude (Senior Developer) on 2026-02-02*
