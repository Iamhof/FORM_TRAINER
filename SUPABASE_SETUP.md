# Supabase Database Setup Guide

This guide will help you set up your Supabase database for the FORM fitness app.

## Prerequisites

1. Create a Supabase account at https://supabase.com
2. Create a new project in Supabase
3. Get your project URL and anon key from Project Settings > API

## Environment Variables

Create a `.env` file in the root of your project with the following variables:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_secure_random_jwt_secret_here
```

**Important:** 
- Replace `your_supabase_project_url` with your actual Supabase project URL
- Replace `your_supabase_anon_key` with your actual Supabase anon key
- Generate a secure random string for `JWT_SECRET` (at least 32 characters)

## Database Schema

Run the following SQL commands in your Supabase SQL Editor to create the required tables:

### 1. Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster email lookups
CREATE INDEX idx_users_email ON users(email);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);
```

### 2. Programmes Table

```sql
CREATE TABLE programmes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  days INTEGER NOT NULL,
  weeks INTEGER NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster user lookups
CREATE INDEX idx_programmes_user_id ON programmes(user_id);

-- Enable Row Level Security
ALTER TABLE programmes ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only access their own programmes
CREATE POLICY "Users can manage own programmes" ON programmes
  FOR ALL USING (auth.uid() = user_id);
```

### 3. Workouts Table

```sql
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  programme_id UUID NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
  programme_name TEXT NOT NULL,
  day INTEGER NOT NULL,
  week INTEGER NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]',
  completed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_workouts_user_id ON workouts(user_id);
CREATE INDEX idx_workouts_programme_id ON workouts(programme_id);
CREATE INDEX idx_workouts_completed_at ON workouts(completed_at DESC);

-- Enable Row Level Security
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only access their own workouts
CREATE POLICY "Users can manage own workouts" ON workouts
  FOR ALL USING (auth.uid() = user_id);
```

### 4. Analytics Table

```sql
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  date DATE NOT NULL,
  max_weight NUMERIC NOT NULL,
  total_volume NUMERIC NOT NULL,
  total_reps INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, exercise_id, date)
);

-- Create indexes for faster queries
CREATE INDEX idx_analytics_user_id ON analytics(user_id);
CREATE INDEX idx_analytics_exercise_id ON analytics(exercise_id);
CREATE INDEX idx_analytics_date ON analytics(date DESC);

-- Enable Row Level Security
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only access their own analytics
CREATE POLICY "Users can manage own analytics" ON analytics
  FOR ALL USING (auth.uid() = user_id);
```

### 5. Create Updated At Trigger Function

```sql
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to programmes table
CREATE TRIGGER update_programmes_updated_at
  BEFORE UPDATE ON programmes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Data Structure Examples

### Programmes.exercises JSONB Structure
```json
[
  {
    "day": 1,
    "exerciseId": "bench-press",
    "sets": 4,
    "reps": "8-10",
    "rest": 120
  },
  {
    "day": 1,
    "exerciseId": "incline-dumbbell-press",
    "sets": 3,
    "reps": "10-12",
    "rest": 90
  }
]
```

### Workouts.exercises JSONB Structure
```json
[
  {
    "exerciseId": "bench-press",
    "sets": [
      { "weight": 80, "reps": 10, "completed": true },
      { "weight": 85, "reps": 8, "completed": true },
      { "weight": 90, "reps": 6, "completed": true }
    ]
  }
]
```

## Security Notes

1. **Row Level Security (RLS)** is enabled on all tables to ensure users can only access their own data
2. **Password hashing** is handled by the backend using bcrypt
3. **JWT tokens** are used for authentication with a 30-day expiration
4. **HTTPS only** - Supabase enforces HTTPS for all connections

## Testing Your Setup

After running the SQL commands:

1. Check that all tables are created in the Supabase Table Editor
2. Verify that RLS policies are enabled
3. Test the authentication flow by creating a user through the app
4. Verify that data is being saved correctly in each table

## Troubleshooting

### Common Issues

1. **"relation does not exist" error**
   - Make sure you ran all SQL commands in order
   - Check that you're using the correct schema (usually `public`)

2. **"permission denied" error**
   - Verify RLS policies are set up correctly
   - Check that your JWT token is being sent in requests

3. **Connection errors**
   - Verify your `.env` file has the correct Supabase URL and key
   - Make sure the environment variables are loaded (restart your dev server)

## Next Steps

After setting up the database:

1. Test user registration and login
2. Create a test programme
3. Log a workout
4. Verify data isolation between different users

## Support

For issues with Supabase setup, refer to:
- Supabase Documentation: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
