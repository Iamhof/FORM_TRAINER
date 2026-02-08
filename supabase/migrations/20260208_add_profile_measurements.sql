-- Add measurement columns to profiles table for Edit Profile screen

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS height_cm INTEGER;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5,1);

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS age INTEGER;

-- Add check constraints for reasonable values
ALTER TABLE profiles
ADD CONSTRAINT valid_height_cm CHECK (height_cm IS NULL OR (height_cm >= 50 AND height_cm <= 300));

ALTER TABLE profiles
ADD CONSTRAINT valid_weight_kg CHECK (weight_kg IS NULL OR (weight_kg >= 20.0 AND weight_kg <= 500.0));

ALTER TABLE profiles
ADD CONSTRAINT valid_age CHECK (age IS NULL OR (age >= 10 AND age <= 120));
