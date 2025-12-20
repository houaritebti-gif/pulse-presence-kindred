-- Create profile_music_styles table for music preferences (up to 5)
CREATE TABLE public.profile_music_styles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  style TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(profile_id, style)
);

-- Enable RLS
ALTER TABLE public.profile_music_styles ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Music styles viewable by authenticated" 
ON public.profile_music_styles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own music styles" 
ON public.profile_music_styles 
FOR ALL 
USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Add optional details columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_tattoos BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS has_piercings BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS alternative_aesthetic BOOLEAN DEFAULT NULL;