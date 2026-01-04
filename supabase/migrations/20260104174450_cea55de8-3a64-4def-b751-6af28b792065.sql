
-- Create identity verification requests table
CREATE TABLE public.identity_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  selfie_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint - one pending/approved verification per profile
CREATE UNIQUE INDEX idx_identity_verifications_active ON public.identity_verifications (profile_id) 
WHERE status IN ('pending', 'approved');

-- Add identity_verified column to profiles
ALTER TABLE public.profiles ADD COLUMN identity_verified BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE public.identity_verifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own verifications
CREATE POLICY "Users can view own verifications" 
ON public.identity_verifications 
FOR SELECT 
USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Users can create verification requests
CREATE POLICY "Users can create verification requests" 
ON public.identity_verifications 
FOR INSERT 
WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Admins can manage all verifications
CREATE POLICY "Admins can manage verifications" 
ON public.identity_verifications 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_identity_verifications_updated_at
BEFORE UPDATE ON public.identity_verifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for selfies
INSERT INTO storage.buckets (id, name, public) 
VALUES ('identity-selfies', 'identity-selfies', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for selfies - users can upload their own
CREATE POLICY "Users can upload own selfies"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'identity-selfies' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can view their own selfies
CREATE POLICY "Users can view own selfies"
ON storage.objects FOR SELECT
USING (bucket_id = 'identity-selfies' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can view all selfies
CREATE POLICY "Admins can view all selfies"
ON storage.objects FOR SELECT
USING (bucket_id = 'identity-selfies' AND public.has_role(auth.uid(), 'admin'));
