-- ============================================
-- RATE LIMITING TABLE FOR PUSH NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.push_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  request_count INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT push_rate_limits_unique UNIQUE (profile_id, window_start)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_push_rate_limits_profile_window 
ON public.push_rate_limits (profile_id, window_start);

-- Auto-cleanup old rate limit records (older than 1 hour)
CREATE INDEX IF NOT EXISTS idx_push_rate_limits_cleanup 
ON public.push_rate_limits (window_start);

-- Enable RLS (service_role only access)
ALTER TABLE public.push_rate_limits ENABLE ROW LEVEL SECURITY;

-- No policies = only service_role can access (internal use only)

-- ============================================
-- INTERNAL SECRETS ROTATION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.internal_secrets_rotation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  secret_name TEXT NOT NULL UNIQUE,
  current_secret TEXT NOT NULL,
  previous_secret TEXT,
  rotated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  next_rotation_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '90 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (service_role only access)
ALTER TABLE public.internal_secrets_rotation ENABLE ROW LEVEL SECURITY;

-- No policies = only service_role can access (internal use only)

-- ============================================
-- SECRETS ROTATION AUDIT LOG
-- ============================================
CREATE TABLE IF NOT EXISTS public.secrets_rotation_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  secret_name TEXT NOT NULL,
  action TEXT NOT NULL, -- 'rotation_scheduled', 'rotation_completed', 'rotation_failed'
  details TEXT,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.secrets_rotation_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FUNCTION TO CHECK RATE LIMIT
-- ============================================
CREATE OR REPLACE FUNCTION public.check_push_rate_limit(
  p_profile_id UUID,
  p_max_requests INTEGER DEFAULT 30,
  p_window_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_current_count INTEGER;
BEGIN
  -- Calculate window start (truncated to the minute)
  v_window_start := date_trunc('minute', now());
  
  -- Try to insert or update the rate limit record
  INSERT INTO push_rate_limits (profile_id, window_start, request_count)
  VALUES (p_profile_id, v_window_start, 1)
  ON CONFLICT (profile_id, window_start) 
  DO UPDATE SET request_count = push_rate_limits.request_count + 1
  RETURNING request_count INTO v_current_count;
  
  -- Return true if under limit, false if exceeded
  RETURN v_current_count <= p_max_requests;
END;
$$;

-- ============================================
-- FUNCTION TO GENERATE SECURE SECRET
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_internal_secret()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN 'kiki-internal-' || encode(gen_random_bytes(16), 'hex');
END;
$$;

-- ============================================
-- FUNCTION TO ROTATE SECRET
-- ============================================
CREATE OR REPLACE FUNCTION public.rotate_internal_secret(p_secret_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_new_secret TEXT;
  v_old_secret TEXT;
BEGIN
  -- Generate new secret
  v_new_secret := generate_internal_secret();
  
  -- Get current secret
  SELECT current_secret INTO v_old_secret
  FROM internal_secrets_rotation
  WHERE secret_name = p_secret_name;
  
  -- Update or insert
  INSERT INTO internal_secrets_rotation (secret_name, current_secret, previous_secret, rotated_at, next_rotation_at)
  VALUES (p_secret_name, v_new_secret, v_old_secret, now(), now() + INTERVAL '90 days')
  ON CONFLICT (secret_name) 
  DO UPDATE SET 
    previous_secret = internal_secrets_rotation.current_secret,
    current_secret = v_new_secret,
    rotated_at = now(),
    next_rotation_at = now() + INTERVAL '90 days';
  
  -- Log the rotation
  INSERT INTO secrets_rotation_log (secret_name, action, details)
  VALUES (p_secret_name, 'rotation_completed', 'Secret rotated successfully');
  
  RETURN v_new_secret;
END;
$$;

-- ============================================
-- FUNCTION TO VALIDATE SECRET (supports current + previous for grace period)
-- ============================================
CREATE OR REPLACE FUNCTION public.validate_internal_secret(p_secret_name TEXT, p_provided_secret TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_record RECORD;
BEGIN
  SELECT current_secret, previous_secret, rotated_at
  INTO v_record
  FROM internal_secrets_rotation
  WHERE secret_name = p_secret_name;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check current secret
  IF v_record.current_secret = p_provided_secret THEN
    RETURN TRUE;
  END IF;
  
  -- Check previous secret (24-hour grace period after rotation)
  IF v_record.previous_secret = p_provided_secret 
     AND v_record.rotated_at > now() - INTERVAL '24 hours' THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- ============================================
-- CLEANUP FUNCTION FOR OLD RATE LIMIT RECORDS
-- ============================================
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM push_rate_limits
  WHERE window_start < now() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;