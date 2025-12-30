-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Presence viewable with legitimate interactions" ON presence;

-- Create new policy that allows viewing presence for users in the same city
CREATE POLICY "Presence viewable in same city"
ON presence
FOR SELECT
USING (
  -- Can always see own presence
  (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
  OR
  (
    -- Must be visible to others
    visible_to_others = true
    -- Must not be blocked (either direction)
    AND NOT EXISTS (
      SELECT 1 FROM user_blocks ub
      JOIN profiles viewer ON viewer.user_id = auth.uid()
      WHERE 
        (ub.blocker_profile_id = viewer.id AND ub.blocked_profile_id = presence.profile_id)
        OR (ub.blocker_profile_id = presence.profile_id AND ub.blocked_profile_id = viewer.id)
    )
    -- Must be in the same city (case-insensitive)
    AND EXISTS (
      SELECT 1 FROM profiles target_profile
      JOIN profiles viewer_profile ON viewer_profile.user_id = auth.uid()
      WHERE target_profile.id = presence.profile_id
      AND LOWER(target_profile.city) = LOWER(viewer_profile.city)
    )
  )
);