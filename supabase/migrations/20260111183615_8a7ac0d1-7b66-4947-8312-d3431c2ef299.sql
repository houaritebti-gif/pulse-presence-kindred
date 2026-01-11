-- Add is_super_spark column to ghost_messages for Super Chispa feature
ALTER TABLE public.ghost_messages 
ADD COLUMN IF NOT EXISTS is_super_spark boolean DEFAULT false;

-- Create index for querying super sparks
CREATE INDEX IF NOT EXISTS idx_ghost_messages_super_spark 
ON public.ghost_messages (to_profile_id, is_super_spark) 
WHERE is_super_spark = true;

-- Add comment to explain the column
COMMENT ON COLUMN public.ghost_messages.is_super_spark IS 'Indicates if this is a Super Chispa (premium super-like that costs Spark Energy)';