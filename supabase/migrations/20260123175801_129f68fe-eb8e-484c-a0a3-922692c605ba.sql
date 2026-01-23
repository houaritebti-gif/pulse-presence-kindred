-- Drop ALL existing policies on internal_secrets_rotation
-- Having NO policies + RLS enabled = only service_role can access
DROP POLICY IF EXISTS "No public access to secrets" ON public.internal_secrets_rotation;
DROP POLICY IF EXISTS "internal_secrets_rotation_select" ON public.internal_secrets_rotation;
DROP POLICY IF EXISTS "internal_secrets_rotation_insert" ON public.internal_secrets_rotation;
DROP POLICY IF EXISTS "internal_secrets_rotation_update" ON public.internal_secrets_rotation;
DROP POLICY IF EXISTS "internal_secrets_rotation_delete" ON public.internal_secrets_rotation;

-- Ensure RLS is enabled (no-op if already enabled)
ALTER TABLE public.internal_secrets_rotation ENABLE ROW LEVEL SECURITY;

-- IMPORTANT: We intentionally create NO policies here
-- With RLS enabled and NO policies, only service_role can access this table
-- This is the most secure configuration for sensitive secret storage

-- Also secure the secrets_rotation_log table the same way
DROP POLICY IF EXISTS "No public access to rotation log" ON public.secrets_rotation_log;
DROP POLICY IF EXISTS "secrets_rotation_log_select" ON public.secrets_rotation_log;
DROP POLICY IF EXISTS "secrets_rotation_log_insert" ON public.secrets_rotation_log;

ALTER TABLE public.secrets_rotation_log ENABLE ROW LEVEL SECURITY;

-- Add a comment to document the security model
COMMENT ON TABLE public.internal_secrets_rotation IS 'Contains internal secrets for trigger authentication. NO RLS policies = service_role only access. This is intentional for maximum security.';