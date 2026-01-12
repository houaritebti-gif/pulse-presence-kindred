-- Fix chat-audio bucket security: restrict uploads to user's own folder
-- This matches the security pattern used in avatars, chat-images, and profile-photos buckets

-- Drop the overly permissive upload policy
DROP POLICY IF EXISTS "Authenticated users can upload audio" ON storage.objects;

-- Create a restrictive policy that enforces user folder segregation
-- Users can only upload to their own folder: {user_id}/filename.ext
CREATE POLICY "Users can upload audio to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-audio' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Also add an UPDATE policy for users to update their own audio files
CREATE POLICY "Users can update own audio files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'chat-audio' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'chat-audio' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);