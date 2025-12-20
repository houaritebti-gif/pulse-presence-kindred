-- Create quedadas (meetups) table
CREATE TABLE public.quedadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  city TEXT NOT NULL,
  location_hint TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  max_attendees INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quedada attendees table
CREATE TABLE public.quedada_attendees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quedada_id UUID NOT NULL REFERENCES public.quedadas(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(quedada_id, profile_id)
);

-- Enable RLS
ALTER TABLE public.quedadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quedada_attendees ENABLE ROW LEVEL SECURITY;

-- Quedadas policies: visible to users in same city
CREATE POLICY "Users can see quedadas in their city"
ON public.quedadas
FOR SELECT
USING (
  city IN (
    SELECT p.city FROM public.profiles p WHERE p.user_id = auth.uid()
  )
  AND event_date > now()
);

CREATE POLICY "Users can create quedadas"
ON public.quedadas
FOR INSERT
WITH CHECK (
  creator_profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own quedadas"
ON public.quedadas
FOR UPDATE
USING (
  creator_profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own quedadas"
ON public.quedadas
FOR DELETE
USING (
  creator_profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Attendees policies
CREATE POLICY "Users can see attendees of quedadas they can see"
ON public.quedada_attendees
FOR SELECT
USING (
  quedada_id IN (
    SELECT q.id FROM public.quedadas q
    WHERE q.city IN (
      SELECT p.city FROM public.profiles p WHERE p.user_id = auth.uid()
    )
    AND q.event_date > now()
  )
);

CREATE POLICY "Users can join quedadas"
ON public.quedada_attendees
FOR INSERT
WITH CHECK (
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can leave quedadas"
ON public.quedada_attendees
FOR DELETE
USING (
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Enable realtime for quedadas
ALTER PUBLICATION supabase_realtime ADD TABLE public.quedadas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quedada_attendees;