-- Fix function search path
CREATE OR REPLACE FUNCTION public.calculate_age(birthdate DATE)
RETURNS INTEGER AS $$
BEGIN
  IF birthdate IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birthdate))::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;