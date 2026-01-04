-- Create table for KIKI Now boosts
CREATE TABLE public.kiki_now_boosts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_kiki_now_boosts_profile_expires ON public.kiki_now_boosts(profile_id, expires_at);
CREATE INDEX idx_kiki_now_boosts_expires ON public.kiki_now_boosts(expires_at);

-- Enable RLS
ALTER TABLE public.kiki_now_boosts ENABLE ROW LEVEL SECURITY;

-- Users can view their own boosts
CREATE POLICY "Users can view their own boosts"
ON public.kiki_now_boosts
FOR SELECT
USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Anyone can check if a profile has an active boost (for display in presence list)
CREATE POLICY "Anyone can check active boosts"
ON public.kiki_now_boosts
FOR SELECT
USING (expires_at > now());

-- Create function to check if a profile has active boost
CREATE OR REPLACE FUNCTION public.has_active_kiki_now_boost(p_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.kiki_now_boosts
    WHERE profile_id = p_profile_id
    AND expires_at > now()
  )
$$;

-- Enable realtime for boost updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.kiki_now_boosts;