-- Create table to track read status
CREATE TABLE public.quedada_read_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quedada_id uuid NOT NULL REFERENCES public.quedadas(id) ON DELETE CASCADE,
  last_read_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(profile_id, quedada_id)
);

-- Enable RLS
ALTER TABLE public.quedada_read_status ENABLE ROW LEVEL SECURITY;

-- Users can see their own read status
CREATE POLICY "Users can see their own read status"
ON public.quedada_read_status
FOR SELECT
USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Users can upsert their own read status
CREATE POLICY "Users can upsert their own read status"
ON public.quedada_read_status
FOR INSERT
WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own read status"
ON public.quedada_read_status
FOR UPDATE
USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));