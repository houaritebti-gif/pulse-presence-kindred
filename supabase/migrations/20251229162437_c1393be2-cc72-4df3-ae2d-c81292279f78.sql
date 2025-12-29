-- Añadir filtrado de usuarios bloqueados en quedada_messages
DROP POLICY IF EXISTS "Attendees and creators can see quedada messages" ON public.quedada_messages;

CREATE POLICY "Attendees and creators can see messages excluding blocked"
ON public.quedada_messages
FOR SELECT
USING (
  -- El usuario debe ser creador o asistente de la quedada
  quedada_id IN (
    SELECT q.id FROM quedadas q
    WHERE q.creator_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    UNION
    SELECT qa.quedada_id FROM quedada_attendees qa
    WHERE qa.profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  -- Y el remitente del mensaje no está bloqueado
  AND NOT EXISTS (
    SELECT 1 FROM user_blocks ub
    JOIN profiles viewer ON viewer.user_id = auth.uid()
    WHERE 
      (ub.blocker_profile_id = viewer.id AND ub.blocked_profile_id = quedada_messages.sender_profile_id)
      OR
      (ub.blocker_profile_id = quedada_messages.sender_profile_id AND ub.blocked_profile_id = viewer.id)
  )
);