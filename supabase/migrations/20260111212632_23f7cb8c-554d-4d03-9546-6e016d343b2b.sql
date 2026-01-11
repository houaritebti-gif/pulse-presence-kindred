-- Enable RLS on stripe_customer_data if not already enabled
ALTER TABLE public.stripe_customer_data ENABLE ROW LEVEL SECURITY;

-- stripe_customer_data should ONLY be accessible via service_role (edge functions/webhooks)
-- No direct user access allowed - contains sensitive Stripe IDs

-- Policy: Block all SELECT from authenticated users (service_role bypasses RLS)
CREATE POLICY "No user access to stripe data"
ON public.stripe_customer_data
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Note: service_role key bypasses RLS entirely, so Stripe webhooks can still access this table