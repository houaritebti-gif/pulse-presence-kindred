-- Create table for email alert history
CREATE TABLE public.email_alert_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_by UUID REFERENCES auth.users(id),
  recipients_count INTEGER NOT NULL DEFAULT 0,
  is_test BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'success',
  message_id TEXT,
  alert_count INTEGER,
  threshold INTEGER,
  time_window_minutes INTEGER,
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.email_alert_history ENABLE ROW LEVEL SECURITY;

-- Only admins can view and insert
CREATE POLICY "Admins can view email alert history"
ON public.email_alert_history
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert email alert history"
ON public.email_alert_history
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_alert_history;