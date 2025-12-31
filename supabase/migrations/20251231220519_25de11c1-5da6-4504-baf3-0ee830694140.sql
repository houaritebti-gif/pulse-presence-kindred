-- Create function to handle premium ghost message notifications
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

    -- Send push notification
    PERFORM net.http_post(
      url := (SELECT current_setting('app.settings.supabase_url', true) || '/functions/v1/send-push-notification'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT current_setting('app.settings.service_role_key', true))
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

-- Create trigger for premium ghost messages
DROP TRIGGER IF EXISTS on_premium_ghost_message ON public.ghost_messages;
CREATE TRIGGER on_premium_ghost_message
  AFTER INSERT ON public.ghost_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_premium_ghost_message();