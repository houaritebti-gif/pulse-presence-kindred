-- Create reactions table for quedada messages
CREATE TABLE public.quedada_message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.quedada_messages(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, profile_id, emoji)
);

-- Enable RLS
ALTER TABLE public.quedada_message_reactions ENABLE ROW LEVEL SECURITY;

-- Users can see reactions on messages they can see
CREATE POLICY "Users can see reactions on accessible messages"
ON public.quedada_message_reactions
FOR SELECT
USING (
  message_id IN (
    SELECT qm.id FROM quedada_messages qm
    WHERE qm.quedada_id IN (
      SELECT q.id FROM quedadas q
      WHERE q.creator_profile_id IN (
        SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
      )
      UNION
      SELECT qa.quedada_id FROM quedada_attendees qa
      WHERE qa.profile_id IN (
        SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
      )
    )
  )
);

-- Users can add reactions to messages they can see
CREATE POLICY "Users can add reactions"
ON public.quedada_message_reactions
FOR INSERT
WITH CHECK (
  profile_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())
  AND message_id IN (
    SELECT qm.id FROM quedada_messages qm
    WHERE qm.quedada_id IN (
      SELECT q.id FROM quedadas q
      WHERE q.creator_profile_id IN (
        SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
      )
      UNION
      SELECT qa.quedada_id FROM quedada_attendees qa
      WHERE qa.profile_id IN (
        SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
      )
    )
  )
);

-- Users can remove their own reactions
CREATE POLICY "Users can remove their own reactions"
ON public.quedada_message_reactions
FOR DELETE
USING (
  profile_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())
);

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.quedada_message_reactions;