-- Create table for user achievements/badges
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(profile_id, achievement_key)
);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Users can view their own achievements
CREATE POLICY "Users can view their own achievements"
ON public.user_achievements
FOR SELECT
USING (profile_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
));

-- Users can insert their own achievements
CREATE POLICY "Users can insert their own achievements"
ON public.user_achievements
FOR INSERT
WITH CHECK (profile_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
));

-- Create index for faster lookups
CREATE INDEX idx_user_achievements_profile_id ON public.user_achievements(profile_id);
CREATE INDEX idx_user_achievements_key ON public.user_achievements(achievement_key);

-- Enable realtime for achievements
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_achievements;