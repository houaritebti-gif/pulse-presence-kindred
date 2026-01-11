-- Create table for muted spark chats
CREATE TABLE public.muted_spark_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  chat_id UUID NOT NULL REFERENCES public.spark_chats(id) ON DELETE CASCADE,
  muted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, chat_id)
);

-- Enable RLS
ALTER TABLE public.muted_spark_chats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own muted spark chats"
ON public.muted_spark_chats
FOR SELECT
USING (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id));

CREATE POLICY "Users can mute spark chats"
ON public.muted_spark_chats
FOR INSERT
WITH CHECK (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id));

CREATE POLICY "Users can unmute spark chats"
ON public.muted_spark_chats
FOR DELETE
USING (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id));

-- Add index for faster lookups
CREATE INDEX idx_muted_spark_chats_profile ON public.muted_spark_chats(profile_id);
CREATE INDEX idx_muted_spark_chats_chat ON public.muted_spark_chats(chat_id);