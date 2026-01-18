-- Drop the overly restrictive city-based policy
DROP POLICY IF EXISTS "Presence viewable in same city" ON public.presence;

-- Create a new policy that allows viewing all visible presence entries
-- while still respecting blocks
CREATE POLICY "Users can view visible presence entries"
ON public.presence
FOR SELECT
USING (
  -- Can always see own presence
  profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR (
    -- Can see others who are visible
    visible_to_others = true
    -- Block check: neither user has blocked the other
    AND NOT EXISTS (
      SELECT 1 FROM user_blocks ub
      JOIN profiles viewer ON viewer.user_id = auth.uid()
      WHERE (
        (ub.blocker_profile_id = viewer.id AND ub.blocked_profile_id = presence.profile_id)
        OR (ub.blocker_profile_id = presence.profile_id AND ub.blocked_profile_id = viewer.id)
      )
    )
  )
);