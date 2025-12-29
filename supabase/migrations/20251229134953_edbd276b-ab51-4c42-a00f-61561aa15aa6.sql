-- Add optional message column to connection_requests
ALTER TABLE public.connection_requests
ADD COLUMN message TEXT;

-- Add constraint for message length (max 200 characters)
ALTER TABLE public.connection_requests
ADD CONSTRAINT connection_request_message_length CHECK (char_length(message) <= 200);

-- Update the notification function to include the message preview
CREATE OR REPLACE FUNCTION public.handle_new_connection_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;