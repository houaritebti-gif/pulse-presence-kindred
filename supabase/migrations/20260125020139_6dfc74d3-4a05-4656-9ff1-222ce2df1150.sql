-- Create a helper function to check if a profile has visible presence
CREATE OR REPLACE FUNCTION public.has_visible_presence(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM presence
    WHERE profile_id = p_profile_id
    AND visible_to_others = true
  )
$$;

-- Update profiles RLS to allow viewing profiles with visible presence
DROP POLICY IF EXISTS "Profiles viewable with legitimate interactions" ON public.profiles;
CREATE POLICY "Profiles viewable with legitimate interactions or presence"
ON public.profiles
FOR SELECT
USING (
  user_id = auth.uid() 
  OR can_view_profile(auth.uid(), id)
  OR has_visible_presence(id)
);

-- Update profile_tribes RLS
DROP POLICY IF EXISTS "Tribes viewable with legitimate interactions" ON public.profile_tribes;
CREATE POLICY "Tribes viewable with legitimate interactions or presence"
ON public.profile_tribes
FOR SELECT
USING (
  can_view_profile(auth.uid(), profile_id)
  OR has_visible_presence(profile_id)
);

-- Update profile_music_styles RLS  
DROP POLICY IF EXISTS "Music styles viewable with legitimate interactions" ON public.profile_music_styles;
CREATE POLICY "Music styles viewable with legitimate interactions or presence"
ON public.profile_music_styles
FOR SELECT
USING (
  can_view_profile(auth.uid(), profile_id)
  OR has_visible_presence(profile_id)
);

-- Update profile_interests RLS
DROP POLICY IF EXISTS "Interests viewable with legitimate interactions" ON public.profile_interests;
CREATE POLICY "Interests viewable with legitimate interactions or presence"
ON public.profile_interests
FOR SELECT
USING (
  can_view_profile(auth.uid(), profile_id)
  OR has_visible_presence(profile_id)
);

-- Update profile_photos RLS
DROP POLICY IF EXISTS "Profile photos viewable with legitimate interactions" ON public.profile_photos;
CREATE POLICY "Profile photos viewable with legitimate interactions or presence"
ON public.profile_photos
FOR SELECT
USING (
  can_view_profile(auth.uid(), profile_id)
  OR has_visible_presence(profile_id)
);

-- Update profile_gender_preferences RLS
DROP POLICY IF EXISTS "Users can view preferences with legitimate interactions" ON public.profile_gender_preferences;
CREATE POLICY "Gender preferences viewable with legitimate interactions or presence"
ON public.profile_gender_preferences
FOR SELECT
USING (
  can_view_profile(auth.uid(), profile_id)
  OR has_visible_presence(profile_id)
);