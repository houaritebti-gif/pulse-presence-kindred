-- Add JSONB column for flexible optional details storage
ALTER TABLE public.profiles 
ADD COLUMN optional_details jsonb DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.optional_details IS 'Stores flexible optional details like accessibility, beliefs, lifestyle, relationship preferences, etc. Keys match OPTIONAL_DETAILS constants.';