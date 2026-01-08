-- Create table to track purchased shop items
CREATE TABLE public.spark_purchased_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  used_quantity INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Constraint to ensure used doesn't exceed quantity
  CONSTRAINT valid_usage CHECK (used_quantity <= quantity)
);

-- Enable RLS
ALTER TABLE public.spark_purchased_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own purchased items"
ON public.spark_purchased_items
FOR SELECT
USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own purchased items"
ON public.spark_purchased_items
FOR INSERT
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own purchased items"
ON public.spark_purchased_items
FOR UPDATE
USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Index for fast lookups
CREATE INDEX idx_spark_purchased_items_profile_key ON public.spark_purchased_items(profile_id, item_key);
CREATE INDEX idx_spark_purchased_items_expires ON public.spark_purchased_items(expires_at) WHERE expires_at IS NOT NULL;

-- Function to get available quantity for an item
CREATE OR REPLACE FUNCTION public.get_available_item_quantity(p_profile_id UUID, p_item_key TEXT)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(quantity - used_quantity), 0)::INTEGER
  FROM public.spark_purchased_items
  WHERE profile_id = p_profile_id
    AND item_key = p_item_key
    AND (expires_at IS NULL OR expires_at > now())
    AND used_quantity < quantity
$$;

-- Function to use a purchased item
CREATE OR REPLACE FUNCTION public.use_purchased_item(p_profile_id UUID, p_item_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item_id UUID;
BEGIN
  -- Find the oldest non-expired item with available uses
  SELECT id INTO v_item_id
  FROM public.spark_purchased_items
  WHERE profile_id = p_profile_id
    AND item_key = p_item_key
    AND (expires_at IS NULL OR expires_at > now())
    AND used_quantity < quantity
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE;
  
  IF v_item_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Increment used quantity
  UPDATE public.spark_purchased_items
  SET used_quantity = used_quantity + 1
  WHERE id = v_item_id;
  
  RETURN TRUE;
END;
$$;