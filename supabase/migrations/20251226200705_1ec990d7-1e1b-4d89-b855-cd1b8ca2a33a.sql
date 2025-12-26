-- Create storage bucket for voice messages
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-audio', 'chat-audio', true);

-- Policy: Authenticated users can upload audio
CREATE POLICY "Authenticated users can upload audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-audio');

-- Policy: Anyone can view audio files (public bucket)
CREATE POLICY "Anyone can view audio files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-audio');

-- Policy: Users can delete their own audio files
CREATE POLICY "Users can delete own audio"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-audio' AND (storage.foldername(name))[1] = auth.uid()::text);