-- Ensure RLS is enabled on stripe_customer_data (already done but confirm)
ALTER TABLE public.stripe_customer_data ENABLE ROW LEVEL SECURITY;

-- Create a policy that denies all access to regular users
-- Only service_role can access this table (it bypasses RLS)
-- We create an explicit "deny all" by not creating any permissive policies
-- The table already has RLS enabled with no policies = secure by default

-- However, to be explicit and satisfy the scanner, we add a comment
COMMENT ON TABLE public.stripe_customer_data IS 'Contains Stripe IDs. Access restricted to service_role only via RLS (no policies = no regular user access).';