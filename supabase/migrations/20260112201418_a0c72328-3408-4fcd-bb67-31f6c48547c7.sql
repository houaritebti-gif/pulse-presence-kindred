-- =============================================
-- RLS POLICIES FOR INTERNAL TABLES (service_role only)
-- =============================================

-- 1. internal_secrets_rotation - only service_role (Edge Functions/cron) can access
CREATE POLICY "Service role only access for internal_secrets_rotation"
ON public.internal_secrets_rotation
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- 2. push_rate_limits - only service_role can access (used by triggers and edge functions)
CREATE POLICY "Service role only access for push_rate_limits"
ON public.push_rate_limits
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- 3. secrets_rotation_log - only service_role can access (audit log)
CREATE POLICY "Service role only access for secrets_rotation_log"
ON public.secrets_rotation_log
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- =============================================
-- FIX PERMISSIVE POLICY: cleanup_executions
-- Change from public INSERT with true to service_role only
-- =============================================

-- Drop the old permissive policy
DROP POLICY IF EXISTS "Service role can insert cleanup executions" ON public.cleanup_executions;

-- Create restrictive policy (authenticated users cannot access, service_role bypasses RLS)
CREATE POLICY "Service role only access for cleanup_executions"
ON public.cleanup_executions
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);