-- Create a security definer function to check if user can view a profile
-- This avoids infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.can_view_profile(viewer_user_id uuid, target_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Can always view own profile
    SELECT 1 FROM profiles WHERE id = target_profile_id AND user_id = viewer_user_id
  )
  OR EXISTS (
    -- Can view profiles of users in active spark chats
    SELECT 1 FROM spark_chats sc
    JOIN profiles viewer_p ON viewer_p.user_id = viewer_user_id
    WHERE 
      (sc.profile_a_id = viewer_p.id AND sc.profile_b_id = target_profile_id
       AND sc.extinguished_by_a = false AND sc.extinguished_by_b = false)
      OR
      (sc.profile_b_id = viewer_p.id AND sc.profile_a_id = target_profile_id
       AND sc.extinguished_by_a = false AND sc.extinguished_by_b = false)
  )
  OR EXISTS (
    -- Can view profiles of users in same quedadas (both as attendee or creator)
    SELECT 1 FROM profiles viewer_p
    WHERE viewer_p.user_id = viewer_user_id
    AND (
      -- Target is creator of a quedada where viewer is attendee
      EXISTS (
        SELECT 1 FROM quedadas q
        JOIN quedada_attendees qa ON qa.quedada_id = q.id
        WHERE q.creator_profile_id = target_profile_id
        AND qa.profile_id = viewer_p.id
        AND q.event_date > now()
      )
      OR
      -- Target is attendee of a quedada where viewer is creator
      EXISTS (
        SELECT 1 FROM quedadas q
        JOIN quedada_attendees qa ON qa.quedada_id = q.id
        WHERE q.creator_profile_id = viewer_p.id
        AND qa.profile_id = target_profile_id
        AND q.event_date > now()
      )
      OR
      -- Both are attendees of the same quedada
      EXISTS (
        SELECT 1 FROM quedada_attendees qa1
        JOIN quedada_attendees qa2 ON qa1.quedada_id = qa2.quedada_id
        JOIN quedadas q ON q.id = qa1.quedada_id
        WHERE qa1.profile_id = viewer_p.id
        AND qa2.profile_id = target_profile_id
        AND q.event_date > now()
      )
      OR
      -- Both are creators of quedadas (they can see each other) - optional, remove if not needed
      -- Viewer is creator, target is also creator of quedada in same city
      EXISTS (
        SELECT 1 FROM quedadas q1
        JOIN quedadas q2 ON LOWER(q1.city) = LOWER(q2.city)
        WHERE q1.creator_profile_id = viewer_p.id
        AND q2.creator_profile_id = target_profile_id
        AND q1.event_date > now()
        AND q2.event_date > now()
      )
    )
  )
$$;

-- Drop the existing permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

-- Create new restrictive policy using the security definer function
CREATE POLICY "Profiles viewable with legitimate interactions"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.can_view_profile(auth.uid(), id));