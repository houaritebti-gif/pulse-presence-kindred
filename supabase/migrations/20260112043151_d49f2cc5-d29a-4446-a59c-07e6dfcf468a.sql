-- Update handle_profile_visit_notification to also send push notification with internal secret
CREATE OR REPLACE FUNCTION public.handle_profile_visit_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  visited_user_notify BOOLEAN;
  visitor_city TEXT;
BEGIN
  -- Check if the visited user wants notifications
  SELECT notify_profile_visits INTO visited_user_notify
  FROM profiles
  WHERE id = NEW.visited_profile_id;

  -- Only create notification if user has enabled them
  IF visited_user_notify = true THEN
    -- Get visitor's city for anonymized notification
    SELECT city INTO visitor_city
    FROM profiles
    WHERE id = NEW.visitor_profile_id;

    -- Create in-app notification
    INSERT INTO notifications (profile_id, type, title, description, link)
    VALUES (
      NEW.visited_profile_id,
      'profile_visit',
      '👀 Alguien visitó tu perfil',
      COALESCE('Una persona de ' || visitor_city || ' ha visto tu perfil', 'Alguien ha visto tu perfil'),
      '/profile'
    );

    -- Send push notification with internal secret header
    PERFORM net.http_post(
      url := 'https://kcmchxcbtkevvxpwatec.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-secret', 'kiki-internal-f19d23e8-91ab-4cd0-8e72-66d8ef2cb1a4'
      ),
      body := jsonb_build_object(
        'profile_id', NEW.visited_profile_id,
        'title', '👀 Alguien visitó tu perfil',
        'body', COALESCE('Una persona de ' || visitor_city || ' ha visto tu perfil', 'Alguien ha visto tu perfil'),
        'url', '/profile',
        'tag', 'profile-visit'
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_profile_visit_notification: %', SQLERRM;
  RETURN NEW;
END;
$function$;