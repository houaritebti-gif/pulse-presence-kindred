-- Create daily challenges progress table
CREATE TABLE public.daily_challenge_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_key TEXT NOT NULL,
  challenge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  current_progress INTEGER NOT NULL DEFAULT 0,
  target_value INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  energy_reward INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint: one challenge per user per day
  UNIQUE(profile_id, challenge_key, challenge_date)
);

-- Enable RLS
ALTER TABLE public.daily_challenge_progress ENABLE ROW LEVEL SECURITY;

-- Users can only see their own challenges
CREATE POLICY "Users can view own challenges"
ON public.daily_challenge_progress
FOR SELECT
USING (auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id));

-- Users can insert their own challenges
CREATE POLICY "Users can insert own challenges"
ON public.daily_challenge_progress
FOR INSERT
WITH CHECK (auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id));

-- Users can update their own challenges
CREATE POLICY "Users can update own challenges"
ON public.daily_challenge_progress
FOR UPDATE
USING (auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id));

-- Create index for fast lookups
CREATE INDEX idx_daily_challenges_profile_date ON public.daily_challenge_progress(profile_id, challenge_date);

-- Enable realtime for live progress updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_challenge_progress;