-- Executive Intelligence Brief — Database Schema
-- Run this in the Supabase SQL editor

-- Companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Allow multiple users per company for team plans
-- CREATE UNIQUE INDEX companies_user_id_idx ON companies(user_id);

-- User profiles
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  position TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'rejected')),
  company_name TEXT,
  company_id UUID REFERENCES companies(id),
  requested_at TIMESTAMPTZ,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Company profiles
CREATE TABLE company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  revenue_countries JSONB NOT NULL DEFAULT '[]',
  supplier_countries JSONB NOT NULL DEFAULT '[]',
  competitors JSONB NOT NULL DEFAULT '[]',
  keywords TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX company_profiles_company_id_idx ON company_profiles(company_id);

-- Migration: products + company_notes (run if upgrading an existing database)
-- ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS products TEXT;
-- ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS company_notes TEXT;

-- Briefs
CREATE TABLE briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'generating', 'complete', 'failed')),
  content JSONB,
  generated_at TIMESTAMPTZ,
  week_of DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX briefs_company_id_idx ON briefs(company_id);
CREATE UNIQUE INDEX briefs_company_week_idx ON briefs(company_id, week_of);

-- Row Level Security

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefs ENABLE ROW LEVEL SECURITY;

-- Companies: users can manage companies they belong to
CREATE POLICY "Users can manage their companies"
  ON companies FOR ALL
  USING (
    id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- Company profiles: accessible via company ownership
CREATE POLICY "Users can manage their company profile"
  ON company_profiles FOR ALL
  USING (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()
    )
  );

-- User profiles: users can read/update their own, admins can read all
CREATE POLICY "Users can manage their own profile"
  ON user_profiles FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all profiles"
  ON user_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Briefs: accessible via company ownership
CREATE POLICY "Users can manage their company briefs"
  ON briefs FOR ALL
  USING (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()
    )
  );
