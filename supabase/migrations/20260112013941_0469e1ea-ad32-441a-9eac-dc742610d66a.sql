-- Create profile_visits table to track who visits profiles
CREATE TABLE public.profile_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  visited_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_visit_per_day UNIQUE (visitor_profile_id, visited_profile_id, visit_date)
);

-- Enable RLS
ALTER TABLE public.profile_visits ENABLE ROW LEVEL SECURITY;

-- Users can insert visits (when they view someone's profile)
CREATE POLICY "Users can insert their own visits"
ON public.profile_visits
FOR INSERT
WITH CHECK (visitor_profile_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
));

-- Users can see who visited their profile
CREATE POLICY "Users can view visits to their profile"
ON public.profile_visits
FOR SELECT
USING (visited_profile_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
));

-- Create indexes for performance
CREATE INDEX idx_profile_visits_visited ON public.profile_visits(visited_profile_id);
CREATE INDEX idx_profile_visits_visitor ON public.profile_visits(visitor_profile_id);

-- Add notification preference to profiles
ALTER TABLE public.profiles 
ADD COLUMN notify_profile_visits BOOLEAN NOT NULL DEFAULT true;

-- Create function to handle visit notifications
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
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_profile_visit_notification: %', SQLERRM;
  RETURN NEW;
END;
$function$;

-- Create trigger for visit notifications
CREATE TRIGGER on_profile_visit
AFTER INSERT ON public.profile_visits
FOR EACH ROW
EXECUTE FUNCTION public.handle_profile_visit_notification();