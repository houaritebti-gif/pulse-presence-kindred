/**
 * Adaptive loading configuration based on connection quality.
 */

import { isSlowConnection, prefersReducedData } from './connectionUtils';

export interface AdaptiveConfig {
  imageConcurrency: number;
  preloadCount: number;
  animationsEnabled: boolean;
  lazyLoadThreshold: string;
}

/**
 * Get adaptive loading configuration based on connection
 */
export function getAdaptiveLoadingConfig(): AdaptiveConfig {
  const slow = isSlowConnection();
  const reducedData = prefersReducedData();
  
  return {
    imageConcurrency: slow || reducedData ? 1 : 4,
    preloadCount: slow || reducedData ? 1 : 3,
    animationsEnabled: !slow && !reducedData,
    lazyLoadThreshold: slow ? '100px' : '300px',
  };
}
