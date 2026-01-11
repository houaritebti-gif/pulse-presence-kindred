-- Add preference column to profiles for presence notifications
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notify_new_presence BOOLEAN NOT NULL DEFAULT true;

-- Update the trigger function to respect this preference
CREATE OR REPLACE FUNCTION public.notify_exhausted_users_on_new_presence()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  exhausted_user RECORD;
  new_user_profile RECORD;
  exhausted_user_profile RECORD;
  notifications_today INTEGER;
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
        -- Rate limit: not notified in the last hour
        AND (pe.notified_at IS NULL OR pe.notified_at < now() - interval '1 hour')
    LOOP
      -- Check daily notification limit (max 3 per day)
      SELECT COUNT(*) INTO notifications_today
      FROM notifications
      WHERE profile_id = exhausted_user.profile_id
        AND type = 'new_presence'
        AND created_at >= CURRENT_DATE;

      -- Skip if already received 3 notifications today
      IF notifications_today >= 3 THEN
        CONTINUE;
      END IF;

      -- Get exhausted user's profile and check notification preference
      SELECT city, notify_new_presence INTO exhausted_user_profile
      FROM profiles
      WHERE id = exhausted_user.profile_id;

      -- Skip if user has disabled presence notifications
      IF exhausted_user_profile.notify_new_presence = false THEN
        CONTINUE;
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

      -- Skip if new user is under 18 (safety check)
      IF new_user_age IS NOT NULL AND new_user_age < 18 THEN
        CONTINUE;
      END IF;

      -- Create in-app notification
      INSERT INTO notifications (profile_id, type, title, description, link)
      VALUES (
        exhausted_user.profile_id,
        'new_presence',
        '✨ Nuevos perfiles disponibles',
        CASE 
          WHEN new_user_profile.city IS NOT NULL AND exhausted_user_profile.city = new_user_profile.city 
            THEN 'Alguien de ' || new_user_profile.city || ' acaba de conectarse'
          WHEN new_user_profile.city IS NOT NULL 
            THEN 'Alguien de ' || new_user_profile.city || ' está activo'
          ELSE 'Hay gente nueva esperándote'
        END,
        '/presence'
      );

      -- Send push notification
      BEGIN
        PERFORM net.http_post(
          url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-push-notification',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
          ),
          body := jsonb_build_object(
            'profile_id', exhausted_user.profile_id,
            'title', '✨ Nuevos perfiles disponibles',
            'body', CASE 
              WHEN new_user_profile.city IS NOT NULL AND exhausted_user_profile.city = new_user_profile.city 
                THEN 'Alguien de ' || new_user_profile.city || ' acaba de conectarse'
              WHEN new_user_profile.city IS NOT NULL 
                THEN 'Alguien de ' || new_user_profile.city || ' está activo'
              ELSE 'Hay gente nueva esperándote'
            END,
            'url', '/presence',
            'tag', 'new-presence'
          )
        );
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Push notification error: %', SQLERRM;
      END;

      -- Mark as notified
      UPDATE presence_exhaustion
      SET notified_at = now()
      WHERE profile_id = exhausted_user.profile_id;
    END LOOP;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in notify_exhausted_users_on_new_presence: %', SQLERRM;
  RETURN NEW;
END;
$$;