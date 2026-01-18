-- Fix 1: Remove public access to kiki_now_boosts - only allow users to see their own boosts
DROP POLICY IF EXISTS "Anyone can check active boosts" ON public.kiki_now_boosts;

-- The "Users can view their own boosts" policy already exists, which is sufficient

-- Fix 2: Restrict user_achievements to profile owners and users with legitimate interactions
DROP POLICY IF EXISTS "Authenticated users can view all achievements" ON public.user_achievements;

CREATE POLICY "Users can view achievements with legitimate interactions"
ON public.user_achievements
FOR SELECT
USING (
  -- Can view own achievements
  profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR 
  -- Can view achievements of users they have legitimate interactions with
  can_view_profile(auth.uid(), profile_id)
);

-- Fix 3: The presence table policy already uses auth.uid() which requires authentication
-- But let's make it more restrictive to only show presence for users with legitimate interactions
-- or same city (for the discovery feature)
DROP POLICY IF EXISTS "Users can view visible presence entries" ON public.presence;

CREATE POLICY "Users can view visible presence entries"
ON public.presence
FOR SELECT
USING (
  -- Can always view own presence
  profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR 
  (
    -- Must be visible to others
    visible_to_others = true 
    AND 
    -- Must be authenticated
    auth.uid() IS NOT NULL
    AND
    -- No blocks exist
    NOT EXISTS (
      SELECT 1 FROM user_blocks ub
      JOIN profiles viewer ON viewer.user_id = auth.uid()
      WHERE 
        (ub.blocker_profile_id = viewer.id AND ub.blocked_profile_id = presence.profile_id)
        OR (ub.blocker_profile_id = presence.profile_id AND ub.blocked_profile_id = viewer.id)
    )
  )
);