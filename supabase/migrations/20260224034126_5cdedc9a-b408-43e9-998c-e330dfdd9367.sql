
-- Create trigger function to check for mutual sparks on the sparks table
CREATE OR REPLACE FUNCTION public.check_mutual_spark_from_sparks()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  mutual_exists BOOLEAN;
  existing_chat UUID;
  ordered_a UUID;
  ordered_b UUID;
BEGIN
  -- Check if the other person also sent a spark
  SELECT EXISTS (
    SELECT 1 FROM public.sparks
    WHERE from_profile_id = NEW.to_profile_id
    AND to_profile_id = NEW.from_profile_id
  ) INTO mutual_exists;

  -- Also check ghost_messages for backward compatibility
  IF NOT mutual_exists THEN
    SELECT EXISTS (
      SELECT 1 FROM public.ghost_messages
      WHERE from_profile_id = NEW.to_profile_id
      AND to_profile_id = NEW.from_profile_id
    ) INTO mutual_exists;
  END IF;

  IF mutual_exists THEN
    -- Order profile IDs consistently to avoid duplicates
    IF NEW.from_profile_id < NEW.to_profile_id THEN
      ordered_a := NEW.from_profile_id;
      ordered_b := NEW.to_profile_id;
    ELSE
      ordered_a := NEW.to_profile_id;
      ordered_b := NEW.from_profile_id;
    END IF;

    -- Check if chat already exists
    SELECT id INTO existing_chat
    FROM public.spark_chats
    WHERE profile_a_id = ordered_a AND profile_b_id = ordered_b;

    -- Create chat if doesn't exist
    IF existing_chat IS NULL THEN
      INSERT INTO public.spark_chats (profile_a_id, profile_b_id)
      VALUES (ordered_a, ordered_b);
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Also update the original check_mutual_spark to also check sparks table
CREATE OR REPLACE FUNCTION public.check_mutual_spark()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  mutual_exists BOOLEAN;
  existing_chat UUID;
  ordered_a UUID;
  ordered_b UUID;
BEGIN
  -- Check if the other person also sent a ghost message
  SELECT EXISTS (
    SELECT 1 FROM public.ghost_messages
    WHERE from_profile_id = NEW.to_profile_id
    AND to_profile_id = NEW.from_profile_id
  ) INTO mutual_exists;

  -- Also check sparks table for cross-compatibility
  IF NOT mutual_exists THEN
    SELECT EXISTS (
      SELECT 1 FROM public.sparks
      WHERE from_profile_id = NEW.to_profile_id
      AND to_profile_id = NEW.from_profile_id
    ) INTO mutual_exists;
  END IF;

  IF mutual_exists THEN
    IF NEW.from_profile_id < NEW.to_profile_id THEN
      ordered_a := NEW.from_profile_id;
      ordered_b := NEW.to_profile_id;
    ELSE
      ordered_a := NEW.to_profile_id;
      ordered_b := NEW.from_profile_id;
    END IF;

    SELECT id INTO existing_chat
    FROM public.spark_chats
    WHERE profile_a_id = ordered_a AND profile_b_id = ordered_b;

    IF existing_chat IS NULL THEN
      INSERT INTO public.spark_chats (profile_a_id, profile_b_id)
      VALUES (ordered_a, ordered_b);
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger on sparks table
CREATE TRIGGER on_spark_check_mutual
  AFTER INSERT ON public.sparks
  FOR EACH ROW
  EXECUTE FUNCTION public.check_mutual_spark_from_sparks();
