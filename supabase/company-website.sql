-- Add website field to companies table
-- Run this in Supabase SQL Editor (once)

ALTER TABLE companies ADD COLUMN IF NOT EXISTS website TEXT;
