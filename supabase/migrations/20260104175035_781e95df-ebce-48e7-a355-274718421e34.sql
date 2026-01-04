
-- Add manual_review status and ai_confidence to identity_verifications
ALTER TABLE public.identity_verifications 
DROP CONSTRAINT IF EXISTS identity_verifications_status_check;

ALTER TABLE public.identity_verifications 
ADD CONSTRAINT identity_verifications_status_check 
CHECK (status IN ('pending', 'manual_review', 'approved', 'rejected'));

ALTER TABLE public.identity_verifications 
ADD COLUMN IF NOT EXISTS ai_confidence TEXT,
ADD COLUMN IF NOT EXISTS ai_reason TEXT;

-- Update index to include manual_review in active verifications
DROP INDEX IF EXISTS idx_identity_verifications_active;
CREATE UNIQUE INDEX idx_identity_verifications_active ON public.identity_verifications (profile_id) 
WHERE status IN ('pending', 'manual_review', 'approved');

-- Add policy for admins to update verifications
CREATE POLICY "Admins can update verifications" 
ON public.identity_verifications 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));
