-- Añadir filtrado de usuarios bloqueados en quedadas
DROP POLICY IF EXISTS "Users can see quedadas in their city" ON public.quedadas;

CREATE POLICY "Users can see quedadas in their city excluding blocked"
ON public.quedadas
FOR SELECT
USING (
  (lower(city) IN (SELECT lower(p.city) FROM profiles p WHERE p.user_id = auth.uid()))
  AND (event_date > now())
  -- Excluir quedadas de usuarios bloqueados
  AND NOT EXISTS (
    SELECT 1 FROM user_blocks ub
    JOIN profiles viewer ON viewer.user_id = auth.uid()
    WHERE 
      (ub.blocker_profile_id = viewer.id AND ub.blocked_profile_id = quedadas.creator_profile_id)
      OR
      (ub.blocker_profile_id = quedadas.creator_profile_id AND ub.blocked_profile_id = viewer.id)
  )
);

-- Añadir filtrado de usuarios bloqueados en quedada_attendees
DROP POLICY IF EXISTS "Users can see attendees of quedadas they can see" ON public.quedada_attendees;

CREATE POLICY "Users can see attendees excluding blocked"
ON public.quedada_attendees
FOR SELECT
USING (
  -- La quedada debe ser visible para el usuario
  quedada_id IN (
    SELECT q.id FROM quedadas q
    WHERE (lower(q.city) IN (SELECT lower(p.city) FROM profiles p WHERE p.user_id = auth.uid()))
    AND (q.event_date > now())
    AND NOT EXISTS (
      SELECT 1 FROM user_blocks ub
      JOIN profiles viewer ON viewer.user_id = auth.uid()
      WHERE 
        (ub.blocker_profile_id = viewer.id AND ub.blocked_profile_id = q.creator_profile_id)
        OR
        (ub.blocker_profile_id = q.creator_profile_id AND ub.blocked_profile_id = viewer.id)
    )
  )
  -- Y el asistente no está bloqueado
  AND NOT EXISTS (
    SELECT 1 FROM user_blocks ub
    JOIN profiles viewer ON viewer.user_id = auth.uid()
    WHERE 
      (ub.blocker_profile_id = viewer.id AND ub.blocked_profile_id = quedada_attendees.profile_id)
      OR
      (ub.blocker_profile_id = quedada_attendees.profile_id AND ub.blocked_profile_id = viewer.id)
  )
);