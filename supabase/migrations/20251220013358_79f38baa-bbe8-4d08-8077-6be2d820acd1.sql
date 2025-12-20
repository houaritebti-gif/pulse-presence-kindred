-- Create quedada messages table
CREATE TABLE public.quedada_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quedada_id UUID NOT NULL REFERENCES public.quedadas(id) ON DELETE CASCADE,
  sender_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quedada_messages ENABLE ROW LEVEL SECURITY;

-- Users can see messages if they are attending or created the quedada
CREATE POLICY "Attendees and creators can see quedada messages"
ON public.quedada_messages
FOR SELECT
USING (
  quedada_id IN (
    SELECT q.id FROM public.quedadas q
    WHERE q.creator_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
    UNION
    SELECT qa.quedada_id FROM public.quedada_attendees qa
    WHERE qa.profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

-- Users can send messages if they are attending or created the quedada
CREATE POLICY "Attendees and creators can send quedada messages"
ON public.quedada_messages
FOR INSERT
WITH CHECK (
  sender_profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
  AND quedada_id IN (
    SELECT q.id FROM public.quedadas q
    WHERE q.creator_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
    UNION
    SELECT qa.quedada_id FROM public.quedada_attendees qa
    WHERE qa.profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.quedada_messages;