-- Add RLS policy to allow viewing all user achievements for leaderboard
CREATE POLICY "Anyone can view achievements for leaderboard"
ON public.user_achievements
FOR SELECT
USING (true);