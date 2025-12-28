-- Add trial tracking columns to user_subscriptions
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS trial_started_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS trial_used boolean DEFAULT false;