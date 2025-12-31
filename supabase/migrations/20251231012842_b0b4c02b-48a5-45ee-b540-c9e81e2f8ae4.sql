-- Add premium ghost message fields
ALTER TABLE public.ghost_messages 
ADD COLUMN IF NOT EXISTS is_premium_message boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_second_chance boolean DEFAULT false;

-- Add index for faster queries on premium messages
CREATE INDEX IF NOT EXISTS idx_ghost_messages_is_premium ON public.ghost_messages(is_premium_message) WHERE is_premium_message = true;

-- Update the RLS policy to allow inserting with new fields (INSERT already exists, just ensuring it works)
-- The existing insert policy should work since it only checks from_profile_id = profile_id

-- Comment on columns for documentation
COMMENT ON COLUMN public.ghost_messages.is_premium_message IS 'True if sender used a Premium special message (shows ✨ to recipient)';
COMMENT ON COLUMN public.ghost_messages.is_second_chance IS 'True if this is a second attempt message (Premium only, after X days of no response)';