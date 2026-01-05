-- Add birthdate field to profiles for age calculation
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS birthdate DATE;

-- Create a function to calculate age from birthdate
CREATE OR REPLACE FUNCTION public.calculate_age(birthdate DATE)
RETURNS INTEGER AS $$
BEGIN
  IF birthdate IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birthdate))::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add a comment for documentation
COMMENT ON COLUMN public.profiles.birthdate IS 'User birthdate for age calculation. Age displayed publicly, exact date kept private.';