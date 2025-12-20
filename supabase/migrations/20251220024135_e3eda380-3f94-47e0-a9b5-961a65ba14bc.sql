-- Table to store push notification subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY "Users can view their own push subscriptions"
ON public.push_subscriptions
FOR SELECT
USING (profile_id IN (
  SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
));

CREATE POLICY "Users can create their own push subscriptions"
ON public.push_subscriptions
FOR INSERT
WITH CHECK (profile_id IN (
  SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own push subscriptions"
ON public.push_subscriptions
FOR DELETE
USING (profile_id IN (
  SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
));