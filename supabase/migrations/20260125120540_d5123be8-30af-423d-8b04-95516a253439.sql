-- Add geolocation columns to profiles (optional, privacy-friendly)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS share_location BOOLEAN DEFAULT false;

-- Add index for location-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Create a function to calculate approximate distance in km using Haversine formula
CREATE OR REPLACE FUNCTION public.calculate_distance_km(
  lat1 DOUBLE PRECISION,
  lng1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lng2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE 
    WHEN lat1 IS NULL OR lng1 IS NULL OR lat2 IS NULL OR lng2 IS NULL THEN NULL
    ELSE (
      6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lng2) - radians(lng1)) +
          sin(radians(lat1)) * sin(radians(lat2))
        ))
      )
    )
  END
$$;

-- Create a security definer function to get distance to another profile (privacy-safe)
CREATE OR REPLACE FUNCTION public.get_distance_to_profile(viewer_user_id UUID, target_profile_id UUID)
RETURNS DOUBLE PRECISION
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT calculate_distance_km(
    viewer.latitude,
    viewer.longitude,
    target.latitude,
    target.longitude
  )
  FROM profiles viewer, profiles target
  WHERE viewer.user_id = viewer_user_id
    AND target.id = target_profile_id
    AND viewer.latitude IS NOT NULL
    AND viewer.longitude IS NOT NULL
    AND target.latitude IS NOT NULL
    AND target.longitude IS NOT NULL
    AND target.share_location = true
$$;

-- Comment for documentation
COMMENT ON COLUMN public.profiles.latitude IS 'User latitude (optional, only shared if share_location=true)';
COMMENT ON COLUMN public.profiles.longitude IS 'User longitude (optional, only shared if share_location=true)';
COMMENT ON COLUMN public.profiles.share_location IS 'Whether user wants to share their approximate location with others';