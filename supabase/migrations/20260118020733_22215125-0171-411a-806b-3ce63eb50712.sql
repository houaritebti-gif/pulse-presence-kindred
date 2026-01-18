-- Remove hardcoded fallback secrets from all trigger functions

-- 1. Fix handle_new_connection_request
CREATE OR REPLACE FUNCTION public.handle_new_connection_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  sender_city TEXT;
  notification_desc TEXT;
  v_internal_secret TEXT;
BEGIN
  -- Get the current internal secret (no fallback)
  SELECT current_secret INTO v_internal_secret
  FROM internal_secrets_rotation
  WHERE secret_name = 'trigger_internal_secret';

  -- Get sender info (limited since profile is private)
  SELECT city INTO sender_city
  FROM profiles
  WHERE id = NEW.from_profile_id;

  -- Build notification description
  IF NEW.message IS NOT NULL AND NEW.message != '' THEN
    notification_desc := COALESCE('Alguien de ' || sender_city, 'Alguien') || ': "' || LEFT(NEW.message, 50) || CASE WHEN char_length(NEW.message) > 50 THEN '..."' ELSE '"' END;
  ELSE
    notification_desc := COALESCE('Alguien de ' || sender_city || ' quiere conectar contigo', 'Alguien quiere conectar contigo');
  END IF;

  -- Create in-app notification for the recipient
  INSERT INTO notifications (profile_id, type, title, description, link)
  VALUES (
    NEW.to_profile_id,
    'connection_request',
    'Nueva solicitud de conexión',
    notification_desc,
    '/connections'
  );

  -- Only send push notification if secret is available
  IF v_internal_secret IS NOT NULL THEN
    PERFORM net.http_post(
      url := 'https://kcmchxcbtkevvxpwatec.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-secret', v_internal_secret
      ),
      body := jsonb_build_object(
        'profile_id', NEW.to_profile_id,
        'title', 'Nueva solicitud de conexión',
        'body', notification_desc,
        'url', '/connections',
        'tag', 'connection-request'
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_new_connection_request: %', SQLERRM;
  RETURN NEW;
END;
$function$;

-- 2. Fix handle_connection_accepted
CREATE OR REPLACE FUNCTION public.handle_connection_accepted()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  accepter_city TEXT;
  v_internal_secret TEXT;
BEGIN
  -- Get the current internal secret (no fallback)
  SELECT current_secret INTO v_internal_secret
  FROM internal_secrets_rotation
  WHERE secret_name = 'trigger_internal_secret';

  -- Only trigger when status changes to 'accepted'
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    -- Get accepter info
    SELECT city INTO accepter_city
    FROM profiles
    WHERE id = NEW.to_profile_id;

    -- Create in-app notification for the original sender
    INSERT INTO notifications (profile_id, type, title, description, link)
    VALUES (
      NEW.from_profile_id,
      'connection_accepted',
      '¡Conexión aceptada!',
      COALESCE('Alguien de ' || accepter_city || ' aceptó tu solicitud', 'Tu solicitud fue aceptada'),
      '/connections'
    );

    -- Only send push notification if secret is available
    IF v_internal_secret IS NOT NULL THEN
      PERFORM net.http_post(
        url := 'https://kcmchxcbtkevvxpwatec.supabase.co/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-internal-secret', v_internal_secret
        ),
        body := jsonb_build_object(
          'profile_id', NEW.from_profile_id,
          'title', '¡Conexión aceptada!',
          'body', COALESCE('Alguien de ' || accepter_city || ' aceptó tu solicitud', 'Tu solicitud fue aceptada'),
          'url', '/connections',
          'tag', 'connection-accepted'
        )
      );
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_connection_accepted: %', SQLERRM;
  RETURN NEW;
END;
$function$;

-- 3. Fix handle_premium_ghost_message
CREATE OR REPLACE FUNCTION public.handle_premium_ghost_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  sender_city TEXT;
  v_internal_secret TEXT;
BEGIN
  -- Get the current internal secret (no fallback)
  SELECT current_secret INTO v_internal_secret
  FROM internal_secrets_rotation
  WHERE secret_name = 'trigger_internal_secret';

  -- Only trigger for premium messages
  IF NEW.is_premium_message = true THEN
    -- Get sender city for anonymized notification
    SELECT city INTO sender_city
    FROM profiles
    WHERE id = NEW.from_profile_id;

    -- Create in-app notification for the recipient
    INSERT INTO notifications (profile_id, type, title, description, link)
    VALUES (
      NEW.to_profile_id,
      'premium_ghost_message',
      '✨ Mensaje especial recibido',
      COALESCE('Alguien de ' || sender_city || ' invirtió en contactarte', 'Alguien invirtió en contactarte'),
      '/ghost-messages'
    );

    -- Only send push notification if secret is available
    IF v_internal_secret IS NOT NULL THEN
      PERFORM net.http_post(
        url := 'https://kcmchxcbtkevvxpwatec.supabase.co/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-internal-secret', v_internal_secret
        ),
        body := jsonb_build_object(
          'profile_id', NEW.to_profile_id,
          'title', '✨ Mensaje especial recibido',
          'body', COALESCE('Alguien de ' || sender_city || ' invirtió en contactarte', 'Alguien invirtió en contactarte'),
          'url', '/ghost-messages',
          'tag', 'premium-ghost-message'
        )
      );
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_premium_ghost_message: %', SQLERRM;
  RETURN NEW;
END;
$function$;

-- 4. Fix handle_profile_visit_notification
CREATE OR REPLACE FUNCTION public.handle_profile_visit_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  visited_user_notify BOOLEAN;
  visitor_city TEXT;
  v_internal_secret TEXT;
BEGIN
  -- Get the current internal secret (no fallback)
  SELECT current_secret INTO v_internal_secret
  FROM internal_secrets_rotation
  WHERE secret_name = 'trigger_internal_secret';

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

    -- Only send push notification if secret is available
    IF v_internal_secret IS NOT NULL THEN
      PERFORM net.http_post(
        url := 'https://kcmchxcbtkevvxpwatec.supabase.co/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-internal-secret', v_internal_secret
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
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_profile_visit_notification: %', SQLERRM;
  RETURN NEW;
END;
$function$;