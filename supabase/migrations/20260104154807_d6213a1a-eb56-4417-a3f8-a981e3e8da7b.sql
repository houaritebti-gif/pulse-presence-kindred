-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all user reports
CREATE POLICY "Admins can view all reports"
ON public.user_reports
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update user reports status
CREATE POLICY "Admins can update reports"
ON public.user_reports
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));