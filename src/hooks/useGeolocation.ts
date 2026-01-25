import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: string | null;
  permissionState: PermissionState | null;
}

interface ProfileLocation {
  latitude: number | null;
  longitude: number | null;
  share_location: boolean;
  location_updated_at: string | null;
}

export function useGeolocation() {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    loading: false,
    error: null,
    permissionState: null,
  });

  // Fetch current location settings from profile
  const { data: locationSettings } = useQuery({
    queryKey: ['profile-location', profile?.id],
    queryFn: async (): Promise<ProfileLocation | null> => {
      if (!profile?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('latitude, longitude, share_location, location_updated_at')
        .eq('id', profile.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  // Check permission status on mount
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setState(prev => ({ ...prev, permissionState: result.state }));
        
        result.addEventListener('change', () => {
          setState(prev => ({ ...prev, permissionState: result.state }));
        });
      }).catch(() => {
        // Permissions API not supported
      });
    }
  }, []);

  // Request current position
  const requestPosition = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocalización no soportada'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error('Permiso de ubicación denegado'));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new Error('Ubicación no disponible'));
              break;
            case error.TIMEOUT:
              reject(new Error('Tiempo de espera agotado'));
              break;
            default:
              reject(new Error('Error al obtener ubicación'));
          }
        },
        {
          enableHighAccuracy: false, // Use lower accuracy for faster response and privacy
          timeout: 10000,
          maximumAge: 300000, // 5 minutes cache
        }
      );
    });
  }, []);

  // Mutation to update location in profile
  const updateLocationMutation = useMutation({
    mutationFn: async ({ 
      latitude, 
      longitude, 
      shareLocation 
    }: { 
      latitude: number; 
      longitude: number; 
      shareLocation: boolean;
    }) => {
      if (!profile?.id) throw new Error('No profile');

      // Round coordinates to reduce precision (privacy: ~1km accuracy)
      const roundedLat = Math.round(latitude * 100) / 100;
      const roundedLng = Math.round(longitude * 100) / 100;

      const { error } = await supabase
        .from('profiles')
        .update({
          latitude: roundedLat,
          longitude: roundedLng,
          share_location: shareLocation,
          location_updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;
      
      return { latitude: roundedLat, longitude: roundedLng };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-location'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  // Mutation to toggle share_location
  const toggleShareLocationMutation = useMutation({
    mutationFn: async (shareLocation: boolean) => {
      if (!profile?.id) throw new Error('No profile');

      const { error } = await supabase
        .from('profiles')
        .update({ share_location: shareLocation })
        .eq('id', profile.id);

      if (error) throw error;
    },
    onSuccess: (_, shareLocation) => {
      queryClient.invalidateQueries({ queryKey: ['profile-location'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(shareLocation ? 'Ubicación compartida activada' : 'Ubicación compartida desactivada');
    },
    onError: () => {
      toast.error('Error al actualizar preferencia de ubicación');
    },
  });

  // Request and update location
  const updateLocation = useCallback(async (shareLocation: boolean = true) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const position = await requestPosition();
      const { latitude, longitude } = position.coords;
      
      setState(prev => ({ 
        ...prev, 
        latitude, 
        longitude, 
        loading: false 
      }));

      await updateLocationMutation.mutateAsync({ 
        latitude, 
        longitude, 
        shareLocation 
      });

      toast.success('Ubicación actualizada');
      return { latitude, longitude };
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message 
      }));
      toast.error(error.message || 'Error al obtener ubicación');
      throw error;
    }
  }, [requestPosition, updateLocationMutation]);

  // Clear location from profile
  const clearLocation = useCallback(async () => {
    if (!profile?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          latitude: null,
          longitude: null,
          share_location: false,
          location_updated_at: null,
        })
        .eq('id', profile.id);

      if (error) throw error;

      setState({
        latitude: null,
        longitude: null,
        loading: false,
        error: null,
        permissionState: state.permissionState,
      });

      queryClient.invalidateQueries({ queryKey: ['profile-location'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Ubicación eliminada');
    } catch (error) {
      toast.error('Error al eliminar ubicación');
    }
  }, [profile?.id, queryClient, state.permissionState]);

  return {
    // Current state
    latitude: locationSettings?.latitude ?? state.latitude,
    longitude: locationSettings?.longitude ?? state.longitude,
    shareLocation: locationSettings?.share_location ?? false,
    locationUpdatedAt: locationSettings?.location_updated_at,
    loading: state.loading || updateLocationMutation.isPending,
    error: state.error,
    permissionState: state.permissionState,
    
    // Actions
    updateLocation,
    clearLocation,
    toggleShareLocation: toggleShareLocationMutation.mutate,
    
    // Computed
    hasLocation: !!(locationSettings?.latitude && locationSettings?.longitude),
    isSupported: 'geolocation' in navigator,
  };
}

// Helper function to calculate distance between two points (Haversine)
export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Format distance for display
export function formatDistance(distanceKm: number | null | undefined): string | null {
  if (distanceKm === null || distanceKm === undefined) return null;
  
  if (distanceKm < 1) {
    return '< 1 km';
  } else if (distanceKm < 10) {
    return `${Math.round(distanceKm)} km`;
  } else if (distanceKm < 100) {
    return `~${Math.round(distanceKm / 5) * 5} km`;
  } else {
    return `~${Math.round(distanceKm / 10) * 10} km`;
  }
}
