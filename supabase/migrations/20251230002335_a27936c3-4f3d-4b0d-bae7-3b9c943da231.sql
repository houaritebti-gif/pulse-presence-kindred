-- Actualizar política de profile_photos para usar can_view_profile
DROP POLICY IF EXISTS "Profile photos viewable by authenticated users" ON public.profile_photos;

CREATE POLICY "Profile photos viewable with legitimate interactions"
ON public.profile_photos
FOR SELECT
USING (
  public.can_view_profile(auth.uid(), profile_id)
);

-- Actualizar política de profile_tribes para usar can_view_profile
DROP POLICY IF EXISTS "Tribes viewable by authenticated users" ON public.profile_tribes;

CREATE POLICY "Tribes viewable with legitimate interactions"
ON public.profile_tribes
FOR SELECT
USING (
  public.can_view_profile(auth.uid(), profile_id)
);

-- Actualizar política de profile_music_styles para usar can_view_profile
DROP POLICY IF EXISTS "Music styles viewable by authenticated users" ON public.profile_music_styles;

CREATE POLICY "Music styles viewable with legitimate interactions"
ON public.profile_music_styles
FOR SELECT
USING (
  public.can_view_profile(auth.uid(), profile_id)
);