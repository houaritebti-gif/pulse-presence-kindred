-- Create table for cleanup execution history
CREATE TABLE public.cleanup_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_from_completed INTEGER NOT NULL DEFAULT 0,
  deleted_orphaned INTEGER NOT NULL DEFAULT 0,
  deleted_old_verifications INTEGER NOT NULL DEFAULT 0,
  total_deleted INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER,
  triggered_by TEXT DEFAULT 'cron',
  error_message TEXT,
  success BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.cleanup_executions ENABLE ROW LEVEL SECURITY;

-- Only admins can view cleanup history
CREATE POLICY "Admins can view cleanup executions"
  ON public.cleanup_executions
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Service role can insert (edge function)
CREATE POLICY "Service role can insert cleanup executions"
  ON public.cleanup_executions
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_cleanup_executions_executed_at ON public.cleanup_executions(executed_at DESC);