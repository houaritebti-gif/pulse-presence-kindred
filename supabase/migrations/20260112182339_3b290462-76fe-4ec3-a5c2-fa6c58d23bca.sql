-- Enable pgcrypto extension for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update the generate_internal_secret function to use pgcrypto
CREATE OR REPLACE FUNCTION public.generate_internal_secret()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  RETURN 'kiki-internal-' || encode(extensions.gen_random_bytes(16), 'hex');
END;
$$;