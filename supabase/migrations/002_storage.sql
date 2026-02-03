-- Storage bucket for portrait images
-- Note: Run this in Supabase Dashboard SQL Editor
-- The bucket itself is created via Dashboard UI

-- Allow authenticated users to upload to their folder
CREATE POLICY "Users can upload own portraits"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'portraits' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read their own portraits
CREATE POLICY "Users can read own portraits"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'portraits' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own portraits
CREATE POLICY "Users can delete own portraits"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'portraits' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to portraits (needed for n8n workflow)
CREATE POLICY "Public can read portraits"
ON storage.objects FOR SELECT
USING (bucket_id = 'portraits');
