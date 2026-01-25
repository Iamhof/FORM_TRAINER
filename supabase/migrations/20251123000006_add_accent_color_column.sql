-- Migration: Add accent_color column to profiles table
-- Purpose: Store user's selected theme color for cross-device sync
-- Date: 2025-10-19

-- Add accent_color column with default purple color
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#A855F7';

-- Add check constraint to ensure valid hex color format (#RRGGBB)
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS valid_accent_color;

ALTER TABLE profiles
ADD CONSTRAINT valid_accent_color 
CHECK (accent_color ~ '^#[0-9A-Fa-f]{6}$');

-- Create index for potential future queries (optional but recommended for performance)
DROP INDEX IF EXISTS idx_profiles_accent_color;
CREATE INDEX idx_profiles_accent_color ON profiles(accent_color);

-- Add comment to column for documentation
COMMENT ON COLUMN profiles.accent_color IS 'User selected theme accent color in hex format (#RRGGBB). Used for cross-device theme persistence.';

-- Verify the column was added successfully
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'accent_color'
  ) THEN
    RAISE NOTICE 'SUCCESS: accent_color column added to profiles table';
  ELSE
    RAISE EXCEPTION 'FAILED: accent_color column was not added';
  END IF;
END $$;
