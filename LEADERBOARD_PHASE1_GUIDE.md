# Leaderboard Implementation - Phase 1 Complete Guide

## Overview
This guide provides a comprehensive, technically excellent implementation plan for Phase 1 of the leaderboard feature. Phase 1 focuses on the foundational database infrastructure and core backend procedures.

---

## Phase 1: Database Schema & Backend Infrastructure

### ✅ Step 1: Database Schema Setup (COMPLETED)

**Files Created:**
- `LEADERBOARD_DATABASE_SETUP.sql` - Complete database schema
- `types/database.ts` - Updated TypeScript types

**What was implemented:**

1. **Profile Table Extensions**
   - Added `gender` field (male/female/other/prefer_not_to_say)
   - Added `leaderboard_enabled` boolean flag
   - Added `leaderboard_display_name` for privacy
   - Created index for optimized leaderboard queries

2. **Leaderboard Stats Table**
   - Stores pre-calculated statistics for each user
   - Tracks:
     - Total and monthly visits
     - Total and monthly volume (kg)
     - Strength progression percentages
     - Current and longest streaks
     - Exercise-specific records (JSONB)
   - Indexed for fast queries on all sortable fields

3. **User Visits Table**
   - Tracks daily user logins
   - Ensures one entry per user per day
   - Used for visit-based leaderboards

4. **Weekly Completions Table**
   - Tracks programme completion per week
   - Records total vs completed sessions
   - Used for streak calculations

5. **Database Functions**
   - `record_user_visit()` - Auto-tracks visits
   - `update_leaderboard_stats_on_workout()` - Updates stats on workout completion
   - `calculate_user_streak()` - Calculates current streak

6. **Security (RLS Policies)**
   - Users can view all leaderboard stats (public data)
   - Only system can modify leaderboard stats
   - Users can manage their own visits and completions

7. **TypeScript Types**
   - Added comprehensive interfaces for all new tables
   - Added `LeaderboardCategory`, `Gender`, `LeaderboardEntry`, `LeaderboardData` types
   - Updated `User` interface with new fields

**To Execute:**
```bash
# Run this SQL in your Supabase SQL Editor:
# Copy contents of LEADERBOARD_DATABASE_SETUP.sql
```

---

## Next Steps: Backend Implementation

### Step 2: Create Backend tRPC Procedures

#### 2.1: Leaderboard Opt-In/Out Procedure
**File:** `backend/trpc/routes/leaderboard/toggle-opt-in/route.ts`

**Purpose:** Allow users to enable/disable leaderboard participation

**Input:**
```typescript
{
  enabled: boolean;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  display_name?: string;
}
```

**Logic:**
1. Update user's profile with leaderboard settings
2. If enabling: Create initial leaderboard_stats entry
3. If disabling: Keep stats but mark user as not participating
4. Return updated profile

---

#### 2.2: Calculate Leaderboard Stats Procedure
**File:** `backend/trpc/routes/leaderboard/calculate-stats/route.ts`

**Purpose:** Recalculate all statistics for a user (or all users)

**Input:**
```typescript
{
  user_id?: string; // If not provided, calculates for all users
  force_recalculate?: boolean;
}
```

**Calculations:**

**A. Total Visits:**
```sql
SELECT COUNT(DISTINCT visit_date) 
FROM user_visits 
WHERE user_id = ?
```

**B. Current Month Visits:**
```sql
SELECT COUNT(DISTINCT visit_date) 
FROM user_visits 
WHERE user_id = ? 
AND visit_date >= date_trunc('month', CURRENT_DATE)
```

**C. Total Volume (kg):**
```sql
SELECT SUM(total_volume) 
FROM analytics 
WHERE user_id = ?
```

**D. Current Month Volume:**
```sql
SELECT SUM(total_volume) 
FROM analytics 
WHERE user_id = ? 
AND date >= date_trunc('month', CURRENT_DATE)
```

**E. Strength Progression:**
```sql
-- For each exercise, calculate % increase from first to last workout this month
-- Average across all exercises
WITH exercise_progress AS (
  SELECT 
    exercise_id,
    FIRST_VALUE(max_weight) OVER (PARTITION BY exercise_id ORDER BY date) as first_weight,
    LAST_VALUE(max_weight) OVER (PARTITION BY exercise_id ORDER BY date) as last_weight
  FROM analytics
  WHERE user_id = ?
  AND date >= date_trunc('month', CURRENT_DATE)
)
SELECT AVG(
  CASE 
    WHEN first_weight > 0 
    THEN ((last_weight - first_weight) / first_weight * 100)
    ELSE 0 
  END
) as avg_increase
FROM exercise_progress
```

**F. Current Streak:**
- Use `calculate_user_streak()` function
- Check consecutive weeks with completed programmes

**G. Exercise-Specific Records:**
```sql
-- Get max weight for specific exercises (squat, deadlift, bench)
SELECT 
  exercise_id,
  MAX(max_weight) as weight,
  (SELECT reps FROM analytics 
   WHERE user_id = ? 
   AND exercise_id = a.exercise_id 
   AND max_weight = MAX(a.max_weight) 
   LIMIT 1) as reps,
  (SELECT date FROM analytics 
   WHERE user_id = ? 
   AND exercise_id = a.exercise_id 
   AND max_weight = MAX(a.max_weight) 
   LIMIT 1) as date
FROM analytics a
WHERE user_id = ?
AND exercise_id IN ('squat', 'deadlift', 'bench_press')
GROUP BY exercise_id
```

---

#### 2.3: Get Leaderboard Data Procedure
**File:** `backend/trpc/routes/leaderboard/get-leaderboard/route.ts`

**Purpose:** Fetch leaderboard rankings for a specific category

**Input:**
```typescript
{
  category: LeaderboardCategory;
  gender?: 'all' | 'male' | 'female';
  limit?: number; // default 100
  offset?: number; // for pagination
}
```

**Query Structure:**
```sql
WITH ranked_users AS (
  SELECT 
    ls.user_id,
    p.leaderboard_display_name as display_name,
    p.gender,
    -- Select appropriate field based on category
    CASE 
      WHEN ? = 'total_visits' THEN ls.total_visits
      WHEN ? = 'month_visits' THEN ls.current_month_visits
      WHEN ? = 'total_volume' THEN ls.total_volume_kg
      WHEN ? = 'month_volume' THEN ls.current_month_volume_kg
      WHEN ? = 'month_strength_increase' THEN ls.current_month_strength_increase_percent
      WHEN ? = 'streak' THEN ls.current_streak_weeks
      WHEN ? = 'squat' THEN (ls.exercise_records->>'squat')::numeric
      WHEN ? = 'deadlift' THEN (ls.exercise_records->>'deadlift')::numeric
      WHEN ? = 'bench_press' THEN (ls.exercise_records->>'bench_press')::numeric
    END as value,
    ROW_NUMBER() OVER (ORDER BY value DESC) as rank
  FROM leaderboard_stats ls
  JOIN profiles p ON p.user_id = ls.user_id
  WHERE p.leaderboard_enabled = true
  AND (? = 'all' OR p.gender = ?)
  AND value IS NOT NULL
  AND value > 0
)
SELECT * FROM ranked_users
ORDER BY rank
LIMIT ? OFFSET ?
```

**Return:**
```typescript
{
  entries: LeaderboardEntry[];
  current_user_entry: LeaderboardEntry | null;
  total_participants: number;
  last_updated: string;
}
```

---

#### 2.4: Get User Leaderboard Position
**File:** `backend/trpc/routes/leaderboard/get-my-position/route.ts`

**Purpose:** Get current user's position across all leaderboards

**Returns:**
```typescript
{
  positions: {
    category: LeaderboardCategory;
    rank: number;
    value: number;
    total_participants: number;
    percentile: number;
  }[];
}
```

---

#### 2.5: Record Visit Procedure
**File:** `backend/trpc/routes/leaderboard/record-visit/route.ts`

**Purpose:** Record a user visit (called on app launch)

**Logic:**
1. Insert into `user_visits` table (automatically handled by trigger)
2. Update `current_month_visits` in leaderboard_stats
3. Should be idempotent (safe to call multiple times per day)

---

#### 2.6: Update Weekly Completion
**File:** `backend/trpc/routes/leaderboard/update-weekly-completion/route.ts`

**Purpose:** Update weekly completion status when workout is completed

**Input:**
```typescript
{
  programme_id: string;
  week_number: number;
  week_start_date: string;
}
```

**Logic:**
1. Count completed sessions for the week
2. Get total required sessions from programme
3. Update `weekly_completions` table
4. Mark as complete if all sessions done
5. Recalculate streak if week just completed

---

### Step 3: Integration Points

#### 3.1: Update Workout Logging
**File:** `backend/trpc/routes/workouts/log/route.ts`

**Add after successful workout log:**
```typescript
// Update weekly completion
await ctx.supabase
  .rpc('update_weekly_completion', {
    p_user_id: ctx.userId,
    p_programme_id: input.programme_id,
    p_week_start: weekStartDate,
  });

// Trigger leaderboard stats recalculation (async, don't await)
ctx.supabase
  .rpc('update_leaderboard_stats_on_workout', {
    p_user_id: ctx.userId,
  })
  .then(() => console.log('Leaderboard stats updated'));
```

#### 3.2: Record Visits on App Launch
**File:** `app/_layout.tsx` or `contexts/UserContext.tsx`

**Add to user authentication flow:**
```typescript
useEffect(() => {
  if (user?.id) {
    // Record visit on app launch
    trpcClient.leaderboard.recordVisit.mutate().catch(console.error);
  }
}, [user?.id]);
```

---

### Step 4: Scheduled Jobs (Optional but Recommended)

**Using Supabase Edge Functions or Cron Jobs:**

#### Daily Leaderboard Recalculation
**Schedule:** Every day at 2 AM UTC

```typescript
// Recalculate stats for all users
await supabaseAdmin.rpc('recalculate_all_leaderboard_stats');
```

#### Monthly Reset
**Schedule:** First day of each month at 3 AM UTC

```typescript
// Reset monthly counters
await supabaseAdmin.rpc('reset_monthly_leaderboard_stats');
```

---

## Testing Strategy

### Unit Tests
1. Test each calculation function independently
2. Verify streak calculation logic
3. Test gender filtering
4. Verify ranking correctness

### Integration Tests
1. Create test users with known data
2. Verify leaderboard rankings match expected order
3. Test opt-in/opt-out functionality
4. Verify privacy (display names, opt-out users not shown)

### Performance Tests
1. Test with 10,000+ users
2. Verify query performance (<100ms)
3. Test pagination
4. Verify index usage with EXPLAIN ANALYZE

---

## Security Considerations

1. **Privacy:**
   - Users can opt-out at any time
   - Display names hide real names
   - Only aggregated stats are shown

2. **Data Integrity:**
   - Stats are read-only for users (system updates only)
   - Validate all inputs
   - Prevent SQL injection with parameterized queries

3. **Rate Limiting:**
   - Limit leaderboard API calls (e.g., 10/minute)
   - Cache leaderboard data (5-minute TTL)

---

## Performance Optimization

1. **Database Indexes:**
   - ✅ Already created in schema
   - Monitor slow query log

2. **Caching:**
   - Cache leaderboard results for 5 minutes
   - Use Redis or in-memory cache
   - Invalidate on stats update

3. **Pagination:**
   - Always use LIMIT/OFFSET
   - Default limit: 100 entries
   - Maximum limit: 500 entries

4. **Async Calculations:**
   - Don't block workout logging on stats calculation
   - Use background jobs for heavy calculations

---

## Monitoring & Observability

### Key Metrics to Track

1. **Usage Metrics:**
   - Number of users opted-in
   - Leaderboard view count
   - Most popular leaderboard categories

2. **Performance Metrics:**
   - Average query time per category
   - Cache hit rate
   - API error rate

3. **Data Quality:**
   - Users with stale stats (>24 hours old)
   - Invalid data entries
   - Missing required fields

### Logging

```typescript
console.log('[Leaderboard] Query:', {
  category,
  gender,
  duration_ms,
  result_count,
  user_id: ctx.userId,
});
```

---

## Migration Path

### For Existing Users

1. Run database migration
2. Backfill user_visits from auth logs (if available)
3. Calculate initial leaderboard_stats for all users
4. Notify users about new leaderboard feature
5. Encourage opt-in with onboarding flow

---

## Next Phase Preview

**Phase 2: Frontend UI**
- Leaderboard screen with category tabs
- User profile settings for opt-in/out
- Real-time position updates
- Social sharing features
- Achievement badges

**Phase 3: Enhanced Features**
- Friend leaderboards
- Team/gym leaderboards
- Challenge competitions
- Historical rankings
- Push notifications for position changes

---

## Completion Checklist

### Phase 1 - Step 1 ✅
- [x] Database schema created
- [x] TypeScript types defined
- [x] Documentation written

### Phase 1 - Remaining Steps
- [ ] Create leaderboard opt-in/out procedure
- [ ] Create calculate stats procedure
- [ ] Create get leaderboard procedure
- [ ] Create get my position procedure
- [ ] Create record visit procedure
- [ ] Create update weekly completion procedure
- [ ] Integrate with workout logging
- [ ] Add visit recording to app launch
- [ ] Test all procedures
- [ ] Deploy database changes

---

## Support & Troubleshooting

### Common Issues

**Issue:** Stats not updating
- Check if user has leaderboard_enabled = true
- Verify triggers are active
- Check last_calculated_at timestamp

**Issue:** Incorrect rankings
- Verify gender filter is applied correctly
- Check for NULL values in stats
- Validate calculation logic

**Issue:** Slow queries
- Run EXPLAIN ANALYZE on slow queries
- Verify indexes are being used
- Consider materialized views for complex queries

---

## Conclusion

Phase 1 Step 1 is now complete! The foundational database schema is in place with:

✅ Robust data model for all leaderboard features
✅ Optimized indexes for fast queries
✅ Security policies (RLS) for data protection
✅ Automated triggers for real-time updates
✅ Comprehensive TypeScript types
✅ Scalable architecture for future enhancements

Next, we'll build the backend tRPC procedures to interact with this schema.
