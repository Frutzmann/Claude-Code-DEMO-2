-- Fix: Handle background_count = 0 (optional backgrounds)
-- When no backgrounds are provided, the AI generates 3 thumbnails from keywords alone.
-- The previous trigger would cause division by zero when background_count = 0.

CREATE OR REPLACE FUNCTION update_generation_on_thumbnail()
RETURNS TRIGGER AS $$
DECLARE
  gen_record RECORD;
  total_thumbnails INTEGER;
  success_thumbnails INTEGER;
  failed_thumbnails INTEGER;
  expected_count INTEGER;
  new_progress INTEGER;
  new_status TEXT;
BEGIN
  -- Get the generation record
  SELECT * INTO gen_record
  FROM generations
  WHERE id = NEW.generation_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Count thumbnails for this generation
  SELECT
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE status = 'success') AS success,
    COUNT(*) FILTER (WHERE status = 'failed') AS failed
  INTO total_thumbnails, success_thumbnails, failed_thumbnails
  FROM thumbnails
  WHERE generation_id = NEW.generation_id;

  -- Calculate expected count: background_count * 3 prompts (minimum estimate)
  -- When no backgrounds, AI still generates 3 thumbnails from keywords alone
  IF gen_record.background_count > 0 THEN
    expected_count := gen_record.background_count * 3;
  ELSE
    expected_count := 3;
  END IF;

  -- Calculate progress (cap at 99% until we know it's complete)
  -- Progress increases as thumbnails come in
  new_progress := LEAST(99, ROUND((total_thumbnails::NUMERIC / expected_count) * 100));

  -- Determine status based on counts
  -- If we have at least expected_count thumbnails, generation is complete
  IF total_thumbnails >= expected_count THEN
    IF success_thumbnails = 0 AND failed_thumbnails > 0 THEN
      new_status := 'failed';
    ELSIF failed_thumbnails > 0 THEN
      new_status := 'partial';
    ELSE
      new_status := 'completed';
    END IF;
    new_progress := 100;
  ELSE
    -- Still processing
    new_status := 'processing';
  END IF;

  -- Update the generation record
  UPDATE generations
  SET
    progress = new_progress,
    thumbnail_count = success_thumbnails,
    status = new_status,
    current_step = CASE
      WHEN new_status = 'processing' THEN 'Generated ' || total_thumbnails || ' of ~' || expected_count || ' thumbnails'
      WHEN new_status = 'completed' THEN 'Complete'
      WHEN new_status = 'partial' THEN 'Completed with ' || failed_thumbnails || ' failures'
      WHEN new_status = 'failed' THEN 'All thumbnails failed'
      ELSE current_step
    END,
    completed_at = CASE
      WHEN new_status IN ('completed', 'partial', 'failed') AND completed_at IS NULL
      THEN NOW()
      ELSE completed_at
    END,
    error_message = CASE
      WHEN failed_thumbnails > 0 THEN failed_thumbnails || ' thumbnail(s) failed to generate'
      ELSE NULL
    END
  WHERE id = NEW.generation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;