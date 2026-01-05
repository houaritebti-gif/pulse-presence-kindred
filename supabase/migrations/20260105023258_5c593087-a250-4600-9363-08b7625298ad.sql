-- Add DELETE policy for users to remove their own selfies
CREATE POLICY "Users can delete own selfies"
ON storage.objects FOR DELETE
USING (bucket_id = 'identity-selfies' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can delete any selfie (for cleanup/moderation)
CREATE POLICY "Admins can delete selfies"
ON storage.objects FOR DELETE
USING (bucket_id = 'identity-selfies' AND public.has_role(auth.uid(), 'admin'));