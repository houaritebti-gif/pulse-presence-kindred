-- Allow users to update their own messages in spark chats
CREATE POLICY "Users can update their own messages"
ON public.chat_messages
FOR UPDATE
USING (
  sender_profile_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
  )
)
WITH CHECK (
  sender_profile_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
  )
);