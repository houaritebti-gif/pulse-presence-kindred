-- Restringir visibilidad de presence a usuarios con interacciones legítimas
DROP POLICY IF EXISTS "Presence viewable if visible and not blocked" ON public.presence;

CREATE POLICY "Presence viewable with legitimate interactions"
ON public.presence
FOR SELECT
USING (
  -- Siempre puede ver su propia presencia
  profile_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())
  OR
  (
    -- Debe estar visible
    visible_to_others = true
    -- No debe estar bloqueado
    AND NOT EXISTS (
      SELECT 1 FROM user_blocks ub
      JOIN profiles viewer ON viewer.user_id = auth.uid()
      WHERE 
        (ub.blocker_profile_id = viewer.id AND ub.blocked_profile_id = presence.profile_id)
        OR (ub.blocker_profile_id = presence.profile_id AND ub.blocked_profile_id = viewer.id)
    )
    -- Debe tener interacción legítima
    AND (
      -- Conexión aceptada
      EXISTS (
        SELECT 1 FROM connection_requests cr
        JOIN profiles viewer_p ON viewer_p.user_id = auth.uid()
        WHERE cr.status = 'accepted'
        AND (
          (cr.from_profile_id = viewer_p.id AND cr.to_profile_id = presence.profile_id)
          OR (cr.to_profile_id = viewer_p.id AND cr.from_profile_id = presence.profile_id)
        )
      )
      -- O spark chat activo
      OR EXISTS (
        SELECT 1 FROM spark_chats sc
        JOIN profiles viewer_p ON viewer_p.user_id = auth.uid()
        WHERE 
          (sc.profile_a_id = viewer_p.id AND sc.profile_b_id = presence.profile_id
           AND sc.extinguished_by_a = false AND sc.extinguished_by_b = false)
          OR
          (sc.profile_b_id = viewer_p.id AND sc.profile_a_id = presence.profile_id
           AND sc.extinguished_by_a = false AND sc.extinguished_by_b = false)
      )
      -- O compartiendo quedada activa
      OR EXISTS (
        SELECT 1 FROM profiles viewer_p
        WHERE viewer_p.user_id = auth.uid()
        AND (
          -- Target es creador de quedada donde viewer es asistente
          EXISTS (
            SELECT 1 FROM quedadas q
            JOIN quedada_attendees qa ON qa.quedada_id = q.id
            WHERE q.creator_profile_id = presence.profile_id
            AND qa.profile_id = viewer_p.id
            AND q.event_date > now()
          )
          OR
          -- Target es asistente de quedada donde viewer es creador
          EXISTS (
            SELECT 1 FROM quedadas q
            JOIN quedada_attendees qa ON qa.quedada_id = q.id
            WHERE q.creator_profile_id = viewer_p.id
            AND qa.profile_id = presence.profile_id
            AND q.event_date > now()
          )
          OR
          -- Ambos son asistentes de la misma quedada
          EXISTS (
            SELECT 1 FROM quedada_attendees qa1
            JOIN quedada_attendees qa2 ON qa1.quedada_id = qa2.quedada_id
            JOIN quedadas q ON q.id = qa1.quedada_id
            WHERE qa1.profile_id = viewer_p.id
            AND qa2.profile_id = presence.profile_id
            AND q.event_date > now()
          )
        )
      )
    )
  )
);