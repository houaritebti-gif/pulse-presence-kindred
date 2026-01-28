-- =============================================
-- AUDIT LOGGING SYSTEM FOR ADMIN ACTIONS
-- =============================================

-- Create audit log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS (only service_role can access)
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can view audit logs but not modify
CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for faster queries
CREATE INDEX idx_audit_log_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX idx_audit_log_admin_user ON public.admin_audit_log(admin_user_id);
CREATE INDEX idx_audit_log_action ON public.admin_audit_log(action);

-- =============================================
-- DATA RETENTION: AUTO-DELETE OLD PROFILE VISITS
-- =============================================

-- Function to clean up old profile visits (older than 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_profile_visits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.profile_visits
  WHERE visited_at < now() - INTERVAL '90 days';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  -- Log the cleanup action
  INSERT INTO public.admin_audit_log (admin_user_id, action, target_table, new_values)
  VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'automated_cleanup',
    'profile_visits',
    jsonb_build_object('deleted_count', v_deleted, 'retention_days', 90)
  );
  
  RETURN v_deleted;
END;
$$;

-- Function to log admin actions (can be called from edge functions)
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_admin_user_id UUID,
  p_action TEXT,
  p_target_table TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.admin_audit_log (admin_user_id, action, target_table, target_id, old_values, new_values)
  VALUES (p_admin_user_id, p_action, p_target_table, p_target_id, p_old_values, p_new_values)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;