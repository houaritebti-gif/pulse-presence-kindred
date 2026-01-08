-- Create a separate, more restricted table for Stripe payment data
-- This table is ONLY accessible via service_role (edge functions)

CREATE TABLE public.stripe_customer_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(profile_id)
);

-- Enable RLS
ALTER TABLE public.stripe_customer_data ENABLE ROW LEVEL SECURITY;

-- NO RLS policies for regular users - only service_role can access
-- This ensures Stripe IDs are never exposed to the client

-- Migrate existing data from user_subscriptions
INSERT INTO public.stripe_customer_data (profile_id, stripe_customer_id, stripe_subscription_id, created_at, updated_at)
SELECT profile_id, stripe_customer_id, stripe_subscription_id, created_at, updated_at
FROM public.user_subscriptions
WHERE stripe_customer_id IS NOT NULL OR stripe_subscription_id IS NOT NULL
ON CONFLICT (profile_id) DO NOTHING;

-- Remove Stripe columns from user_subscriptions (they will be in the new table)
ALTER TABLE public.user_subscriptions DROP COLUMN IF EXISTS stripe_customer_id;
ALTER TABLE public.user_subscriptions DROP COLUMN IF EXISTS stripe_subscription_id;

-- Add index for faster lookups
CREATE INDEX idx_stripe_customer_data_profile_id ON public.stripe_customer_data(profile_id);