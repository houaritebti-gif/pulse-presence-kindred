-- Allow users to update read_at on messages they received
CREATE POLICY "Users can mark received messages as read" 
ON public.ghost_messages 
FOR UPDATE 
USING (to_profile_id IN (
  SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
))
WITH CHECK (to_profile_id IN (
  SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
));