-- Fix city comparison to be case-insensitive for quedadas visibility
DROP POLICY IF EXISTS "Users can see quedadas in their city" ON public.quedadas;

CREATE POLICY "Users can see quedadas in their city"
ON public.quedadas
FOR SELECT
USING (
  LOWER(city) IN (
    SELECT LOWER(p.city) 
    FROM profiles p 
    WHERE p.user_id = auth.uid()
  ) 
  AND event_date > now()
);