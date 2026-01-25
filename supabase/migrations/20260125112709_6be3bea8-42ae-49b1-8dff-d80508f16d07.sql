-- Create table for profile prompts
CREATE TABLE public.profile_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prompt_key TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, prompt_key)
);

-- Enable RLS
ALTER TABLE public.profile_prompts ENABLE ROW LEVEL SECURITY;

-- Users can manage their own prompts
CREATE POLICY "Users can manage their own prompts"
ON public.profile_prompts
FOR ALL
USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Prompts viewable with presence or legitimate interaction
CREATE POLICY "Prompts viewable with presence or interactions"
ON public.profile_prompts
FOR SELECT
USING (
  can_view_profile(auth.uid(), profile_id)
  OR has_visible_presence(profile_id)
);

-- Create index for faster lookups
CREATE INDEX idx_profile_prompts_profile_id ON public.profile_prompts(profile_id);

-- Add trigger for updated_at
CREATE TRIGGER update_profile_prompts_updated_at
  BEFORE UPDATE ON public.profile_prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();