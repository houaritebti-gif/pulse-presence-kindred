/**
 * Performance metrics and monitoring utilities.
 */

/**
 * Mark when the app becomes interactive
 */
export function markInteractive(): void {
  if ('performance' in window && 'mark' in window.performance) {
    performance.mark('app-interactive');
  }
}

/**
 * Get performance metrics
 */
export function getPerformanceMetrics(): Record<string, number> {
  const metrics: Record<string, number> = {};
  
  if ('performance' in window) {
    const timing = performance.timing;
    if (timing.loadEventEnd > 0) {
      metrics.pageLoad = timing.loadEventEnd - timing.navigationStart;
      metrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
      metrics.firstByte = timing.responseStart - timing.navigationStart;
      metrics.domInteractive = timing.domInteractive - timing.navigationStart;
    }
  }
  
  return metrics;
}

/**
 * Track bundle loading time
 */
export function trackBundleLoad(bundleName: string): () => void {
  const startTime = performance.now();
  
  return () => {
    const duration = performance.now() - startTime;
    if (duration > 1000) {
      console.warn(`[Performance] Slow bundle load: ${bundleName} took ${Math.round(duration)}ms`);
    }
  };
}
