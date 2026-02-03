-- Portraits table for storing user portrait images
-- Note: Run this in Supabase Dashboard SQL Editor after 001_profiles.sql and 002_storage.sql

-- Portraits table
CREATE TABLE IF NOT EXISTS portraits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  label TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE portraits ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can read own portraits"
ON portraits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portraits"
ON portraits FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portraits"
ON portraits FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portraits"
ON portraits FOR DELETE
USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX portraits_user_id_idx ON portraits(user_id);
CREATE INDEX portraits_is_active_idx ON portraits(user_id, is_active) WHERE is_active = TRUE;

-- Reuse update_updated_at() trigger function from 001_profiles.sql
DROP TRIGGER IF EXISTS portraits_updated_at ON portraits;
CREATE TRIGGER portraits_updated_at
  BEFORE UPDATE ON portraits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Note: Storage delete policy already exists in 002_storage.sql
-- If you need to delete storage objects programmatically, ensure the
-- "Users can delete own portraits" policy from 002_storage.sql is applied
