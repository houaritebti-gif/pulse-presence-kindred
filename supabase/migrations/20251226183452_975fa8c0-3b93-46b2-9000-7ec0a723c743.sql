-- Create table to track read status for spark chats
CREATE TABLE public.spark_read_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL,
  profile_id UUID NOT NULL,
  last_read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(chat_id, profile_id)
);

-- Enable RLS
ALTER TABLE public.spark_read_status ENABLE ROW LEVEL SECURITY;

-- Users can see their own read status
CREATE POLICY "Users can see their own spark read status"
ON public.spark_read_status
FOR SELECT
USING (profile_id IN (
  SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
));

-- Users can insert their own read status
CREATE POLICY "Users can insert their own spark read status"
ON public.spark_read_status
FOR INSERT
WITH CHECK (profile_id IN (
  SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
));

-- Users can update their own read status
CREATE POLICY "Users can update their own spark read status"
ON public.spark_read_status
FOR UPDATE
USING (profile_id IN (
  SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
));