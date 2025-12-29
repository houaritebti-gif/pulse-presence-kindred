-- Añadir filtrado de usuarios bloqueados en ghost_messages
DROP POLICY IF EXISTS "Users can see their messages" ON public.ghost_messages;

CREATE POLICY "Users can see their messages"
ON public.ghost_messages
FOR SELECT
USING (
  -- El usuario debe ser remitente o destinatario
  (
    from_profile_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())
    OR 
    to_profile_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())
  )
  -- Y la otra parte no está bloqueada
  AND NOT EXISTS (
    SELECT 1 FROM user_blocks ub
    JOIN profiles viewer ON viewer.user_id = auth.uid()
    WHERE 
      (ub.blocker_profile_id = viewer.id AND ub.blocked_profile_id = ghost_messages.from_profile_id)
      OR
      (ub.blocker_profile_id = viewer.id AND ub.blocked_profile_id = ghost_messages.to_profile_id)
      OR
      (ub.blocker_profile_id = ghost_messages.from_profile_id AND ub.blocked_profile_id = viewer.id)
      OR
      (ub.blocker_profile_id = ghost_messages.to_profile_id AND ub.blocked_profile_id = viewer.id)
  )
);