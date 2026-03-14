-- Migrate location_type (single text) → location_types (text array)
-- Run in Supabase SQL Editor

ALTER TABLE company_locations ADD COLUMN IF NOT EXISTS location_types TEXT[] DEFAULT '{}';

-- Migrate existing rows
UPDATE company_locations
  SET location_types = ARRAY[location_type]
  WHERE location_type IS NOT NULL AND (location_types IS NULL OR location_types = '{}');

-- Optionally drop old column after confirming migration
-- ALTER TABLE company_locations DROP COLUMN location_type;
