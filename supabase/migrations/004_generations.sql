-- Generations and thumbnails tables for tracking AI thumbnail generation jobs
-- Note: Run this in Supabase Dashboard SQL Editor after 001-003 migrations

-- Generations table: tracks the overall generation job
CREATE TABLE IF NOT EXISTS generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Input data
  portrait_id UUID REFERENCES portraits(id) ON DELETE SET NULL,
  portrait_url TEXT NOT NULL,           -- Snapshot at generation time
  keywords TEXT NOT NULL,
  background_count INTEGER NOT NULL,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'partial')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  current_step TEXT,                    -- Human-readable step description

  -- Results
  thumbnail_count INTEGER DEFAULT 0,

  -- Error tracking
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Quota tracking
  credits_used INTEGER DEFAULT 1        -- 1 credit per generation
);

-- Thumbnails table: stores individual generated images
CREATE TABLE IF NOT EXISTS thumbnails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  generation_id UUID REFERENCES generations(id) ON DELETE CASCADE NOT NULL,

  -- Image data
  storage_path TEXT NOT NULL,           -- Path in 'thumbnails' bucket
  public_url TEXT NOT NULL,             -- Public URL for display

  -- Metadata from n8n
  prompt TEXT,                          -- AI-generated prompt used
  prompt_index INTEGER,                 -- Which prompt (0-4)
  background_index INTEGER,             -- Which background image (0-6)
  kie_task_id TEXT,                     -- External task ID for debugging

  -- Status
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed')),
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE thumbnails ENABLE ROW LEVEL SECURITY;

-- RLS policies for generations
CREATE POLICY "Users can read own generations"
ON generations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generations"
ON generations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- No direct UPDATE from users; updates come from service role via callback
-- Service role bypasses RLS by default, but adding explicit policy for clarity
CREATE POLICY "Service role can update generations"
ON generations FOR UPDATE
USING (true)
WITH CHECK (true);

-- RLS policies for thumbnails
CREATE POLICY "Users can read own thumbnails"
ON thumbnails FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM generations g
    WHERE g.id = thumbnails.generation_id
    AND g.user_id = auth.uid()
  )
);

-- Service role can insert thumbnails (bypasses RLS by default)
CREATE POLICY "Service role can insert thumbnails"
ON thumbnails FOR INSERT
WITH CHECK (true);

-- Indexes for performance
CREATE INDEX generations_user_id_idx ON generations(user_id);
CREATE INDEX generations_status_idx ON generations(status);
CREATE INDEX thumbnails_generation_id_idx ON thumbnails(generation_id);

-- Enable Realtime for generations table (allows subscription to status updates)
ALTER TABLE generations REPLICA IDENTITY FULL;

-- Trigger for updated_at (reuse existing function from 001_profiles.sql)
DROP TRIGGER IF EXISTS generations_updated_at ON generations;
CREATE TRIGGER generations_updated_at
  BEFORE UPDATE ON generations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Note: After running this migration, enable Realtime in Supabase Dashboard:
-- Database > Publications > supabase_realtime > toggle 'generations' table ON
