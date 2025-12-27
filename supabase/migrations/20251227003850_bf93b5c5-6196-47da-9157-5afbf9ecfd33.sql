-- Add private_attendees column to quedadas table
ALTER TABLE public.quedadas 
ADD COLUMN private_attendees boolean NOT NULL DEFAULT false;