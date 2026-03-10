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

-- One company per user
CREATE UNIQUE INDEX companies_user_id_idx ON companies(user_id);

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
ALTER TABLE briefs ENABLE ROW LEVEL SECURITY;

-- Companies: users can only access their own
CREATE POLICY "Users can manage their own company"
  ON companies FOR ALL
  USING (auth.uid() = user_id);

-- Company profiles: accessible via company ownership
CREATE POLICY "Users can manage their company profile"
  ON company_profiles FOR ALL
  USING (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()
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
