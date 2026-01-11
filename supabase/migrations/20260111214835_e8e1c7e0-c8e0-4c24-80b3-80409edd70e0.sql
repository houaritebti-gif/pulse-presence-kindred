-- Add preferred summary hour column (0-23, default 9 = 9:00 AM)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notify_summary_hour INTEGER NOT NULL DEFAULT 9
CHECK (notify_summary_hour >= 0 AND notify_summary_hour <= 23);