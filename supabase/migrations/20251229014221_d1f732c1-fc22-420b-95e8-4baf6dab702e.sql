-- Fix city comparison to be case-insensitive for quedada_attendees visibility
DROP POLICY IF EXISTS "Users can see attendees of quedadas they can see" ON public.quedada_attendees;

CREATE POLICY "Users can see attendees of quedadas they can see"
ON public.quedada_attendees
FOR SELECT
USING (
  quedada_id IN (
    SELECT q.id
    FROM quedadas q
    WHERE LOWER(q.city) IN (
      SELECT LOWER(p.city) 
      FROM profiles p 
      WHERE p.user_id = auth.uid()
    )
    AND q.event_date > now()
  )
);