-- Create table for muted quedadas preferences
CREATE TABLE public.muted_quedadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quedada_id UUID NOT NULL REFERENCES public.quedadas(id) ON DELETE CASCADE,
  muted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (profile_id, quedada_id)
);

-- Enable RLS
ALTER TABLE public.muted_quedadas ENABLE ROW LEVEL SECURITY;

-- Users can view their own muted quedadas
CREATE POLICY "Users can view their own muted quedadas"
ON public.muted_quedadas
FOR SELECT
USING (profile_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
));

-- Users can mute quedadas
CREATE POLICY "Users can mute quedadas"
ON public.muted_quedadas
FOR INSERT
WITH CHECK (profile_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
));

-- Users can unmute quedadas
CREATE POLICY "Users can unmute quedadas"
ON public.muted_quedadas
FOR DELETE
USING (profile_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
));

-- Add index for performance
CREATE INDEX idx_muted_quedadas_profile ON public.muted_quedadas(profile_id);
CREATE INDEX idx_muted_quedadas_quedada ON public.muted_quedadas(quedada_id);