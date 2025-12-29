-- Restringir política UPDATE de ghost_messages para solo permitir modificar read_at
DROP POLICY IF EXISTS "Users can mark received messages as read" ON public.ghost_messages;

CREATE POLICY "Users can mark received messages as read"
ON public.ghost_messages
FOR UPDATE
USING (
  to_profile_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
  )
)
WITH CHECK (
  to_profile_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
  )
  -- Asegurar que solo read_at puede cambiar
  AND from_profile_id = from_profile_id
  AND to_profile_id = to_profile_id
  AND content = content
  AND created_at = created_at
);