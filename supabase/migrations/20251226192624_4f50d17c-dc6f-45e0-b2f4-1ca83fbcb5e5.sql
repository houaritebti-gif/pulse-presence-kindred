-- Add updated_at column to track message edits
ALTER TABLE public.chat_messages 
ADD COLUMN updated_at timestamp with time zone DEFAULT NULL;

-- Create trigger to set updated_at on UPDATE
CREATE OR REPLACE FUNCTION public.set_chat_message_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_chat_message_updated_at_trigger
BEFORE UPDATE ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.set_chat_message_updated_at();