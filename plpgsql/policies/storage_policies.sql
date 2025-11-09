-- Storage Bucket RLS Policies for post-media bucket
-- Run this in Supabase SQL Editor to enable file uploads

-- Create policy: Allow authenticated users to upload files to their own folder (userId/*)
CREATE POLICY "Allow authenticated users to upload" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'post-media' AND (auth.uid()::text = (storage.foldername(name))[1]));

-- Create policy: Allow authenticated users to read their own uploaded files
CREATE POLICY "Allow users to view their own files" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'post-media' AND (auth.uid()::text = (storage.foldername(name))[1]));

-- Create policy: Allow authenticated users to delete their own files
CREATE POLICY "Allow users to delete their own files" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'post-media' AND (auth.uid()::text = (storage.foldername(name))[1]));

-- Optional: Allow public read access to all files in post-media bucket (for displaying images)
CREATE POLICY "Allow public read" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'post-media');
