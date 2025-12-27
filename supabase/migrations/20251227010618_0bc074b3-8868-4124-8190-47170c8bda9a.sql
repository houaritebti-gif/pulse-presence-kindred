-- Allow creators to remove attendees from their quedadas
CREATE POLICY "Creators can remove attendees from their quedadas"
ON public.quedada_attendees
FOR DELETE
USING (
  quedada_id IN (
    SELECT id FROM quedadas 
    WHERE creator_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
);