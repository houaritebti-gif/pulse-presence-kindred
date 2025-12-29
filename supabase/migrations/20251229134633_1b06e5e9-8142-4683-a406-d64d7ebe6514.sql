-- Create function to handle new connection requests
CREATE OR REPLACE FUNCTION public.handle_new_connection_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name TEXT;
  sender_city TEXT;
BEGIN
  -- Get sender info (limited since profile is private)
  SELECT city INTO sender_city
  FROM profiles
  WHERE id = NEW.from_profile_id;

  -- Create in-app notification for the recipient
  INSERT INTO notifications (profile_id, type, title, description, link)
  VALUES (
    NEW.to_profile_id,
    'connection_request',
    'Nueva solicitud de conexión',
    COALESCE('Alguien de ' || sender_city || ' quiere conectar contigo', 'Alguien quiere conectar contigo'),
    '/connections'
  );

  -- Call edge function to send push notification
  PERFORM net.http_post(
    url := (SELECT current_setting('app.settings.supabase_url', true) || '/functions/v1/send-push-notification'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT current_setting('app.settings.service_role_key', true))
    ),
    body := jsonb_build_object(
      'profile_id', NEW.to_profile_id,
      'title', 'Nueva solicitud de conexión',
      'body', COALESCE('Alguien de ' || sender_city || ' quiere conectar', 'Alguien quiere conectar contigo'),
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
$$;

-- Create trigger for new connection requests
DROP TRIGGER IF EXISTS on_connection_request_created ON public.connection_requests;
CREATE TRIGGER on_connection_request_created
  AFTER INSERT ON public.connection_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_connection_request();

-- Also create notification when connection is accepted
CREATE OR REPLACE FUNCTION public.handle_connection_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

    -- Send push notification to the sender
    PERFORM net.http_post(
      url := (SELECT current_setting('app.settings.supabase_url', true) || '/functions/v1/send-push-notification'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT current_setting('app.settings.service_role_key', true))
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
$$;

-- Create trigger for connection acceptance
DROP TRIGGER IF EXISTS on_connection_accepted ON public.connection_requests;
CREATE TRIGGER on_connection_accepted
  AFTER UPDATE ON public.connection_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_connection_accepted();