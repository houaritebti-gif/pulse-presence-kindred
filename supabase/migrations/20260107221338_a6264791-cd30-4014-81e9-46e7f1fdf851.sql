-- Create table for cultural interests
CREATE TABLE public.profile_interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  interest TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(profile_id, interest)
);

-- Enable RLS
ALTER TABLE public.profile_interests ENABLE ROW LEVEL SECURITY;

-- Users can manage their own interests
CREATE POLICY "Users can manage their own interests"
ON public.profile_interests
FOR ALL
USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Interests viewable with legitimate interactions
CREATE POLICY "Interests viewable with legitimate interactions"
ON public.profile_interests
FOR SELECT
USING (can_view_profile(auth.uid(), profile_id));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_interests;