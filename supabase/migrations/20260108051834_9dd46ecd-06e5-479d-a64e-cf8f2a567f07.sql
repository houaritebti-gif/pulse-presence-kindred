-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Anyone can view achievements for leaderboard" ON public.user_achievements;

-- Create a new policy that requires authentication
CREATE POLICY "Authenticated users can view all achievements"
ON public.user_achievements
FOR SELECT
TO authenticated
USING (true);

-- Users can still only insert their own achievements
-- (existing policy should already handle this, but ensure it exists)
DROP POLICY IF EXISTS "Users can view their own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can insert their own achievements" ON public.user_achievements;

CREATE POLICY "Users can insert their own achievements"
ON public.user_achievements
FOR INSERT
TO authenticated
WITH CHECK (
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);