import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  getConnectionSpeed, 
  isSlowConnection as checkSlowConnection, 
  prefersReducedData as checkReducedData,
  getNavigatorConnection
} from '@/utils/connectionUtils';
import { getAdaptiveLoadingConfig } from '@/utils/adaptiveConfig';

interface AdaptiveLoadingState {
  /** Current connection speed */
  connectionSpeed: string;
  /** Whether connection is slow (2G or worse) */
  isSlowConnection: boolean;
  /** Whether user prefers reduced data */
  prefersReducedData: boolean;
  /** Number of images to load concurrently */
  imageConcurrency: number;
  /** Number of items to preload ahead */
  preloadCount: number;
  /** Whether animations should be enabled */
  animationsEnabled: boolean;
  /** IntersectionObserver rootMargin for lazy loading */
  lazyLoadThreshold: string;
  /** Whether to use low-quality image placeholders */
  useLowQualityPlaceholders: boolean;
  /** Whether to defer non-critical network requests */
  deferNonCritical: boolean;
}

/**
 * Hook that provides adaptive loading configuration based on network conditions.
 * Updates automatically when connection changes.
 */
export function useAdaptiveLoading(): AdaptiveLoadingState {
  const [connectionSpeed, setConnectionSpeed] = useState(() => getConnectionSpeed());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Memoized checker functions that use current connectionSpeed
  const slow = useMemo(() => checkSlowConnection(), [connectionSpeed]);
  const reducedData = useMemo(() => checkReducedData(), []);

  // Force recalculation of config when connectionSpeed changes
  const config = useMemo(() => getAdaptiveLoadingConfig(), [connectionSpeed]);

  useEffect(() => {
    const updateConnection = () => {
      const newSpeed = getConnectionSpeed();
      setConnectionSpeed(newSpeed);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Listen for connection changes
    const connection = getNavigatorConnection();
    if (connection?.addEventListener) {
      connection.addEventListener('change', updateConnection);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (connection?.removeEventListener) {
        connection.removeEventListener('change', updateConnection);
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return useMemo(() => ({
    connectionSpeed,
    isSlowConnection: slow,
    prefersReducedData: reducedData,
    imageConcurrency: config.imageConcurrency,
    preloadCount: config.preloadCount,
    animationsEnabled: config.animationsEnabled && isOnline,
    lazyLoadThreshold: config.lazyLoadThreshold,
    useLowQualityPlaceholders: slow || reducedData,
    deferNonCritical: slow || !isOnline,
  }), [connectionSpeed, slow, reducedData, config, isOnline]);
}

/**
 * Hook for conditionally loading features based on connection
 */
export function useConditionalFeature(
  feature: 'animations' | 'preload' | 'highQualityImages'
): boolean {
  const { animationsEnabled, isSlowConnection, prefersReducedData } = useAdaptiveLoading();

  return useMemo(() => {
    switch (feature) {
      case 'animations':
        return animationsEnabled;
      case 'preload':
        return !isSlowConnection && !prefersReducedData;
      case 'highQualityImages':
        return !isSlowConnection && !prefersReducedData;
      default:
        return true;
    }
  }, [feature, animationsEnabled, isSlowConnection, prefersReducedData]);
}
