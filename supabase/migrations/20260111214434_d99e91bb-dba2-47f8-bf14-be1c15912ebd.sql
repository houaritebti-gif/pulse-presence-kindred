-- Add same city filter preference
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notify_same_city_only BOOLEAN NOT NULL DEFAULT false;

-- Update the notification function to check city filter
CREATE OR REPLACE FUNCTION public.notify_exhausted_users_on_new_presence()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  exhausted_user RECORD;
  new_user_profile RECORD;
  exhausted_user_profile RECORD;
  gender_match BOOLEAN;
  new_user_age INTEGER;
BEGIN
  -- Only trigger when someone becomes present
  IF NEW.is_present = true AND NEW.visible_to_others = true THEN
    -- Get the new user's profile info
    SELECT id, city, gender, birthdate, name
    INTO new_user_profile
    FROM profiles
    WHERE id = NEW.profile_id;

    -- Calculate new user's age
    IF new_user_profile.birthdate IS NOT NULL THEN
      new_user_age := calculate_age(new_user_profile.birthdate);
    ELSE
      new_user_age := NULL;
    END IF;

    -- Find users who exhausted their list
    FOR exhausted_user IN
      SELECT pe.profile_id
      FROM presence_exhaustion pe
      WHERE pe.profile_id != NEW.profile_id
    LOOP
      -- Get exhausted user's profile and check notification preferences
      SELECT city, notify_new_presence, notify_min_age, notify_max_age, notify_same_city_only
      INTO exhausted_user_profile
      FROM profiles
      WHERE id = exhausted_user.profile_id;

      -- Skip if user has disabled presence notifications
      IF exhausted_user_profile.notify_new_presence = false THEN
        CONTINUE;
      END IF;

      -- Check same city filter
      IF exhausted_user_profile.notify_same_city_only = true THEN
        -- Skip if cities don't match or either is null
        IF exhausted_user_profile.city IS NULL OR new_user_profile.city IS NULL 
           OR LOWER(exhausted_user_profile.city) != LOWER(new_user_profile.city) THEN
          CONTINUE;
        END IF;
      END IF;

      -- Check age range filter
      IF new_user_age IS NOT NULL THEN
        -- Skip if new user is under 18 (safety check)
        IF new_user_age < 18 THEN
          CONTINUE;
        END IF;
        
        -- Check min age preference
        IF exhausted_user_profile.notify_min_age IS NOT NULL AND new_user_age < exhausted_user_profile.notify_min_age THEN
          CONTINUE;
        END IF;
        
        -- Check max age preference
        IF exhausted_user_profile.notify_max_age IS NOT NULL AND new_user_age > exhausted_user_profile.notify_max_age THEN
          CONTINUE;
        END IF;
      END IF;

      -- Check gender preference match
      SELECT EXISTS (
        SELECT 1 FROM profile_gender_preferences pgp
        WHERE pgp.profile_id = exhausted_user.profile_id
          AND pgp.gender_preference = new_user_profile.gender
      ) INTO gender_match;

      -- If user has no gender preferences set, consider it a match
      IF NOT EXISTS (
        SELECT 1 FROM profile_gender_preferences
        WHERE profile_id = exhausted_user.profile_id
      ) THEN
        gender_match := true;
      END IF;

      -- Skip if gender doesn't match preferences
      IF NOT gender_match THEN
        CONTINUE;
      END IF;

      -- Queue the notification for daily summary (upsert to avoid duplicates)
      INSERT INTO pending_presence_notifications (recipient_profile_id, new_user_profile_id, new_user_city)
      VALUES (exhausted_user.profile_id, NEW.profile_id, new_user_profile.city)
      ON CONFLICT (recipient_profile_id, new_user_profile_id) DO NOTHING;
    END LOOP;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in notify_exhausted_users_on_new_presence: %', SQLERRM;
  RETURN NEW;
END;
$function$;