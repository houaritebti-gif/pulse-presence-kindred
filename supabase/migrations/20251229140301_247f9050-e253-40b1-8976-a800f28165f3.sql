-- Drop the old policy that allows anyone to see photos
DROP POLICY IF EXISTS "Profile photos viewable by authenticated" ON public.profile_photos;

-- Create new policy that requires authentication
CREATE POLICY "Profile photos viewable by authenticated users"
ON public.profile_photos
FOR SELECT
USING (auth.uid() IS NOT NULL);