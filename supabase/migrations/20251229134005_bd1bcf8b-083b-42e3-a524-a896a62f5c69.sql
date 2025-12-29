-- Create connection_requests table
CREATE TABLE public.connection_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  responded_at timestamp with time zone,
  UNIQUE (from_profile_id, to_profile_id)
);

-- Enable RLS
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;

-- Users can see requests they sent or received
CREATE POLICY "Users can see their connection requests"
ON public.connection_requests
FOR SELECT
TO authenticated
USING (
  from_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR to_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Users can send connection requests
CREATE POLICY "Users can send connection requests"
ON public.connection_requests
FOR INSERT
TO authenticated
WITH CHECK (
  from_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  AND from_profile_id != to_profile_id
);

-- Users can update requests they received (to accept/reject)
CREATE POLICY "Users can respond to received requests"
ON public.connection_requests
FOR UPDATE
TO authenticated
USING (
  to_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Users can delete requests they sent (cancel) or received (dismiss rejected)
CREATE POLICY "Users can delete their requests"
ON public.connection_requests
FOR DELETE
TO authenticated
USING (
  from_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR to_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Enable realtime for connection_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.connection_requests;

-- Update the can_view_profile function to include accepted connections
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
    -- Can view profiles with accepted connection requests (mutual)
    SELECT 1 FROM connection_requests cr
    JOIN profiles viewer_p ON viewer_p.user_id = viewer_user_id
    WHERE cr.status = 'accepted'
    AND (
      (cr.from_profile_id = viewer_p.id AND cr.to_profile_id = target_profile_id)
      OR (cr.to_profile_id = viewer_p.id AND cr.from_profile_id = target_profile_id)
    )
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
      -- Both are creators of quedadas in same city
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

-- Create a function to check if there's a pending/accepted connection between two profiles
CREATE OR REPLACE FUNCTION public.get_connection_status(viewer_user_id uuid, target_profile_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT 
        CASE 
          WHEN cr.status = 'accepted' THEN 'connected'
          WHEN cr.from_profile_id = viewer_p.id AND cr.status = 'pending' THEN 'pending_sent'
          WHEN cr.to_profile_id = viewer_p.id AND cr.status = 'pending' THEN 'pending_received'
          ELSE 'none'
        END
      FROM connection_requests cr
      JOIN profiles viewer_p ON viewer_p.user_id = viewer_user_id
      WHERE (
        (cr.from_profile_id = viewer_p.id AND cr.to_profile_id = target_profile_id)
        OR (cr.to_profile_id = viewer_p.id AND cr.from_profile_id = target_profile_id)
      )
      AND cr.status != 'rejected'
      LIMIT 1
    ),
    'none'
  )
$$;