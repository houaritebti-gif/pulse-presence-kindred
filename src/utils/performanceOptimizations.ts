/**
 * Performance optimization utilities for initial load and runtime.
 * 
 * This file re-exports utilities from focused modules for backwards compatibility.
 * New code should import directly from the specific module.
 */

// Connection utilities
export { 
  getConnectionSpeed, 
  isSlowConnection, 
  prefersReducedData,
  type ConnectionSpeed,
  type NetworkInformation 
} from './connectionUtils';

// Deferred execution
export { 
  deferWork, 
  batchDeferredWork, 
  scheduleInitialization 
} from './deferredExecution';

// Image preloading
export { 
  preloadImage, 
  preloadImages 
} from './imagePreloading';

// Resource hints
export { 
  addResourceHints,
  type ResourceHint 
} from './resourceHints';

// Performance metrics
export { 
  markInteractive, 
  getPerformanceMetrics, 
  trackBundleLoad 
} from './performanceMetrics';

// Adaptive loading config
export { 
  getAdaptiveLoadingConfig,
  type AdaptiveConfig 
} from './adaptiveConfig';
