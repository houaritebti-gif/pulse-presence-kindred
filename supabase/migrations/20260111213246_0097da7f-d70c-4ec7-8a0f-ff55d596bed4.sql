-- Update the function to limit notifications to 3 per day per user
CREATE OR REPLACE FUNCTION public.notify_exhausted_users_on_new_presence()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  exhausted_user RECORD;
  new_user_city TEXT;
  notifications_today INTEGER;
BEGIN
  -- Only trigger when someone becomes present
  IF NEW.is_present = true AND NEW.visible_to_others = true THEN
    -- Get the city of the newly present user
    SELECT city INTO new_user_city
    FROM profiles
    WHERE id = NEW.profile_id;

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

      -- Create in-app notification
      INSERT INTO notifications (profile_id, type, title, description, link)
      VALUES (
        exhausted_user.profile_id,
        'new_presence',
        '✨ Nuevos perfiles disponibles',
        COALESCE('Alguien de ' || new_user_city || ' acaba de conectarse', 'Hay gente nueva esperándote'),
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
            'body', COALESCE('Alguien de ' || new_user_city || ' acaba de conectarse', 'Hay gente nueva esperándote'),
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