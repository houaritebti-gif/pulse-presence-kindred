-- Table to track users who have exhausted their presence list
CREATE TABLE public.presence_exhaustion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  exhausted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.presence_exhaustion ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own exhaustion status
CREATE POLICY "Users can view their own exhaustion status"
  ON public.presence_exhaustion FOR SELECT
  USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own exhaustion status"
  ON public.presence_exhaustion FOR INSERT
  WITH CHECK (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own exhaustion status"
  ON public.presence_exhaustion FOR UPDATE
  USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own exhaustion status"
  ON public.presence_exhaustion FOR DELETE
  USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Index for quick lookups
CREATE INDEX idx_presence_exhaustion_profile ON public.presence_exhaustion(profile_id);
CREATE INDEX idx_presence_exhaustion_notified ON public.presence_exhaustion(notified_at) WHERE notified_at IS NULL;

-- Function to notify users when new presence is detected
CREATE OR REPLACE FUNCTION public.notify_exhausted_users_on_new_presence()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  exhausted_user RECORD;
  new_user_city TEXT;
BEGIN
  -- Only trigger when someone becomes present
  IF NEW.is_present = true AND NEW.visible_to_others = true THEN
    -- Get the city of the newly present user
    SELECT city INTO new_user_city
    FROM profiles
    WHERE id = NEW.profile_id;

    -- Find users who exhausted their list and haven't been notified in the last hour
    FOR exhausted_user IN
      SELECT pe.profile_id
      FROM presence_exhaustion pe
      WHERE pe.profile_id != NEW.profile_id
        AND (pe.notified_at IS NULL OR pe.notified_at < now() - interval '1 hour')
    LOOP
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

-- Trigger on presence changes
CREATE TRIGGER on_presence_change_notify_exhausted
  AFTER INSERT OR UPDATE OF is_present, visible_to_others ON public.presence
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_exhausted_users_on_new_presence();