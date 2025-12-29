-- Añadir filtrado de usuarios bloqueados a nivel de RLS en presence
DROP POLICY IF EXISTS "Presence viewable if visible" ON public.presence;

CREATE POLICY "Presence viewable if visible and not blocked"
ON public.presence
FOR SELECT
USING (
  -- Puede ver su propia presencia siempre
  (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
  OR
  (
    -- Visible para otros está activado
    visible_to_others = true
    -- Y no hay bloqueo en ninguna dirección
    AND NOT EXISTS (
      SELECT 1 FROM user_blocks ub
      JOIN profiles viewer ON viewer.user_id = auth.uid()
      WHERE 
        -- El usuario actual bloqueó al dueño de esta presencia
        (ub.blocker_profile_id = viewer.id AND ub.blocked_profile_id = presence.profile_id)
        OR
        -- El dueño de esta presencia bloqueó al usuario actual
        (ub.blocker_profile_id = presence.profile_id AND ub.blocked_profile_id = viewer.id)
    )
  )
);