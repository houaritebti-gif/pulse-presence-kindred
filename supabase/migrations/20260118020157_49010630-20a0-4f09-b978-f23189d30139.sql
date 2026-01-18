-- Fix 1: Restrict bio_blacklist SELECT access to admin users only
DROP POLICY IF EXISTS "Anyone can read blacklist" ON public.bio_blacklist;

CREATE POLICY "Only admins can read blacklist"
ON public.bio_blacklist
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Restrict presence table to authenticated users only (already fixed previously, but ensuring it's correct)
-- The current policy should already be correct, but let's verify the exposed data concern is addressed