-- Allow users to delete their own messages in spark chats
CREATE POLICY "Users can delete their own messages"
ON public.chat_messages
FOR DELETE
USING (
  sender_profile_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
  )
);