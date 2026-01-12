-- Update handle_premium_ghost_message with hardcoded URL
CREATE OR REPLACE FUNCTION public.handle_premium_ghost_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  sender_city TEXT;
BEGIN
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

    -- Send push notification - Using direct URL since database settings are not available
    PERFORM net.http_post(
      url := 'https://kcmchxcbtkevvxpwatec.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-secret', 'kiki-internal-f19d23e8-91ab-4cd0-8e72-66d8ef2cb1a4'
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

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_premium_ghost_message: %', SQLERRM;
  RETURN NEW;
END;
$function$;

-- Update handle_connection_accepted with hardcoded URL
CREATE OR REPLACE FUNCTION public.handle_connection_accepted()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  accepter_city TEXT;
BEGIN
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

    -- Send push notification with internal secret header
    PERFORM net.http_post(
      url := 'https://kcmchxcbtkevvxpwatec.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-secret', 'kiki-internal-f19d23e8-91ab-4cd0-8e72-66d8ef2cb1a4'
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

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_connection_accepted: %', SQLERRM;
  RETURN NEW;
END;
$function$;

-- Update handle_new_connection_request with hardcoded URL
CREATE OR REPLACE FUNCTION public.handle_new_connection_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  sender_city TEXT;
  notification_desc TEXT;
BEGIN
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

  -- Send push notification with internal secret header
  PERFORM net.http_post(
    url := 'https://kcmchxcbtkevvxpwatec.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', 'kiki-internal-f19d23e8-91ab-4cd0-8e72-66d8ef2cb1a4'
    ),
    body := jsonb_build_object(
      'profile_id', NEW.to_profile_id,
      'title', 'Nueva solicitud de conexión',
      'body', notification_desc,
      'url', '/connections',
      'tag', 'connection-request'
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the insert
  RAISE WARNING 'Error in handle_new_connection_request: %', SQLERRM;
  RETURN NEW;
END;
$function$;