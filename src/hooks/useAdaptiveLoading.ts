import { useState, useEffect, useMemo } from 'react';
import { 
  getConnectionSpeed, 
  isSlowConnection, 
  prefersReducedData,
  getAdaptiveLoadingConfig 
} from '@/utils/performanceOptimizations';

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
  const [connectionSpeed, setConnectionSpeed] = useState(getConnectionSpeed);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateConnection = () => {
      setConnectionSpeed(getConnectionSpeed());
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Listen for connection changes
    const nav = navigator as Navigator & { connection?: { addEventListener?: (type: string, handler: () => void) => void } };
    if (nav.connection?.addEventListener) {
      nav.connection.addEventListener('change', updateConnection);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (nav.connection?.addEventListener) {
        // Note: removeEventListener might not exist on all implementations
        try {
          (nav.connection as EventTarget).removeEventListener?.('change', updateConnection);
        } catch {
          // Ignore
        }
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const config = useMemo(() => getAdaptiveLoadingConfig(), [connectionSpeed]);
  const slow = useMemo(() => isSlowConnection(), [connectionSpeed]);
  const reducedData = useMemo(() => prefersReducedData(), []);

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
