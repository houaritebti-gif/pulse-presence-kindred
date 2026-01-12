-- Add show_achievements visibility setting to profiles
ALTER TABLE public.profiles 
ADD COLUMN show_achievements BOOLEAN NOT NULL DEFAULT true;