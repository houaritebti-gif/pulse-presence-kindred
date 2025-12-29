-- Fix: Require authentication to view music styles
DROP POLICY IF EXISTS "Music styles viewable by authenticated" ON public.profile_music_styles;

CREATE POLICY "Music styles viewable by authenticated users"
ON public.profile_music_styles
FOR SELECT
USING (auth.uid() IS NOT NULL);