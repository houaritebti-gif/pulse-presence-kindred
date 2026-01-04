-- Create table for blacklisted words (managed by admins)
CREATE TABLE public.bio_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.bio_blacklist ENABLE ROW LEVEL SECURITY;

-- Anyone can read blacklist (needed for client-side validation)
CREATE POLICY "Anyone can read blacklist"
ON public.bio_blacklist
FOR SELECT
TO authenticated
USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert blacklist words"
ON public.bio_blacklist
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Admins can delete blacklist words"
ON public.bio_blacklist
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Function to check if text contains blacklisted words
CREATE OR REPLACE FUNCTION public.contains_blacklisted_words(text_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bio_blacklist bl
    WHERE text_to_check ILIKE '%' || bl.word || '%'
  )
$$;

-- Function to get matching blacklisted words
CREATE OR REPLACE FUNCTION public.get_blacklisted_matches(text_to_check TEXT)
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY_AGG(bl.word)
  FROM public.bio_blacklist bl
  WHERE text_to_check ILIKE '%' || bl.word || '%'
$$;

-- Trigger function to validate bio on profile update
CREATE OR REPLACE FUNCTION public.validate_profile_bio()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  blocked_words TEXT[];
BEGIN
  -- Only check if bio is being set or changed
  IF NEW.bio IS NOT NULL AND (OLD.bio IS NULL OR NEW.bio != OLD.bio) THEN
    SELECT get_blacklisted_matches(NEW.bio) INTO blocked_words;
    
    IF blocked_words IS NOT NULL AND array_length(blocked_words, 1) > 0 THEN
      RAISE EXCEPTION 'Bio contains prohibited words'
        USING HINT = 'blocked_words:' || array_to_string(blocked_words, ',');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table
CREATE TRIGGER validate_bio_before_update
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_bio();

-- Insert some default blacklisted words (Spanish)
INSERT INTO public.bio_blacklist (word) VALUES
  ('puta'),
  ('puto'),
  ('mierda'),
  ('hdp'),
  ('maricón'),
  ('marica'),
  ('zorra'),
  ('cabrón'),
  ('pendejo'),
  ('imbécil')
ON CONFLICT (word) DO NOTHING;