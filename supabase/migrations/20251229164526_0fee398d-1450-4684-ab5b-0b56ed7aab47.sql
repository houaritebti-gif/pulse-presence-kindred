-- Añadir filtrado de usuarios bloqueados en chat_messages (spark chats)
DROP POLICY IF EXISTS "Users can see messages in their chats" ON public.chat_messages;

CREATE POLICY "Users can see messages in their chats"
ON public.chat_messages
FOR SELECT
USING (
  -- El usuario debe ser participante del chat activo
  chat_id IN (
    SELECT spark_chats.id
    FROM spark_chats
    WHERE (
      (spark_chats.profile_a_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()))
      OR 
      (spark_chats.profile_b_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()))
    )
    AND spark_chats.extinguished_by_a = false
    AND spark_chats.extinguished_by_b = false
  )
  -- Y el remitente del mensaje no está bloqueado
  AND NOT EXISTS (
    SELECT 1 FROM user_blocks ub
    JOIN profiles viewer ON viewer.user_id = auth.uid()
    WHERE 
      (ub.blocker_profile_id = viewer.id AND ub.blocked_profile_id = chat_messages.sender_profile_id)
      OR
      (ub.blocker_profile_id = chat_messages.sender_profile_id AND ub.blocked_profile_id = viewer.id)
  )
);