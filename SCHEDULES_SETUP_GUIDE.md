# Schedules Table Setup Guide

This guide will help you set up the schedules table in your Supabase database to enable the interactive weekly calendar feature.

## Steps to Setup

### 1. Open Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor (in the left sidebar)
3. Click "New Query"

### 2. Run the Migration SQL

Copy the entire contents of `SCHEDULES_TABLE_SETUP.sql` and paste it into the SQL editor, then click "Run".

This will:
- Create the `schedules` table with the following columns:
  - `id`: Primary key (UUID)
  - `user_id`: Foreign key to auth.users (UUID)
  - `programme_id`: Foreign key to programmes (UUID, nullable)
  - `week_start`: The start date of the week (DATE)
  - `schedule`: JSONB array containing the week's schedule
  - `created_at`: Timestamp of creation
  - `updated_at`: Timestamp of last update
- Create indexes for performance
- Enable Row Level Security (RLS)
- Set up RLS policies so users can only access their own schedules
- Add PT access so trainers can view their clients' schedules
- Create a trigger to auto-update the `updated_at` timestamp

### 3. Verify the Setup

Run this query to verify the table was created successfully:

```sql
SELECT * FROM public.schedules LIMIT 1;
```

You should see the table structure even if there are no rows yet.

## How It Works

### Schedule Data Structure

Each schedule record contains a JSONB array with 7 days (Monday-Sunday):

```json
[
  {
    "dayOfWeek": 0,
    "status": "scheduled",
    "weekStart": "2025-01-13"
  },
  {
    "dayOfWeek": 1,
    "status": "rest",
    "weekStart": "2025-01-13"
  },
  ...
]
```

**Status values:**
- `'scheduled'`: User has scheduled a workout for this day
- `'completed'`: User has completed a workout on this day
- `'rest'`: User has marked this as a rest day
- `'empty'`: No plan for this day

### User Interaction

1. Users can tap on any day in the calendar to cycle through: `empty` → `scheduled` → `rest` → `empty`
2. The number of `scheduled` days is limited by the programme's `days` property (e.g., if a programme has 3 days/week, users can only schedule 3 workouts)
3. Completed days cannot be changed (locked after workout is logged)
4. The calendar shows the current week by default
5. Changes are automatically saved to the database

## Troubleshooting

If you encounter any errors:

1. **Table already exists**: Drop the existing table first with `DROP TABLE IF EXISTS public.schedules CASCADE;`
2. **RLS errors**: Make sure you're authenticated and the policies are set up correctly
3. **Foreign key errors**: Ensure the `programmes` table exists first

## Next Steps

After setting up the database:
1. The interactive calendar will automatically appear on the home screen
2. Users can start scheduling their weekly workouts by tapping on days
3. The schedule persists across sessions and devices
