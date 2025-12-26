-- Add column to control whether user shares their typing status
ALTER TABLE public.profiles 
ADD COLUMN share_typing_status boolean DEFAULT true;