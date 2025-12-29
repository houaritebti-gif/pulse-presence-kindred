-- Fix: Require authentication to view tribes
DROP POLICY IF EXISTS "Tribes viewable by authenticated" ON public.profile_tribes;

CREATE POLICY "Tribes viewable by authenticated users"
ON public.profile_tribes
FOR SELECT
USING (auth.uid() IS NOT NULL);