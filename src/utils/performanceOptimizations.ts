/**
 * Performance optimization utilities for initial load and runtime.
 */

// Connection speed detection
type ConnectionSpeed = 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';

interface NetworkInformation {
  effectiveType?: ConnectionSpeed;
  saveData?: boolean;
  downlink?: number;
  rtt?: number;
}

/**
 * Detect the user's connection speed
 */
export function getConnectionSpeed(): ConnectionSpeed {
  const nav = navigator as Navigator & { connection?: NetworkInformation };
  if (nav.connection?.effectiveType) {
    return nav.connection.effectiveType;
  }
  return 'unknown';
}

/**
 * Check if user prefers reduced data usage
 */
export function prefersReducedData(): boolean {
  const nav = navigator as Navigator & { connection?: NetworkInformation };
  return nav.connection?.saveData === true;
}

/**
 * Check if connection is slow (2G or worse)
 */
export function isSlowConnection(): boolean {
  const speed = getConnectionSpeed();
  return speed === 'slow-2g' || speed === '2g';
}

/**
 * Defer non-critical work until the browser is idle
 */
export function deferWork(callback: () => void, timeout = 2000): void {
  if ('requestIdleCallback' in window) {
    (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number })
      .requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 100);
  }
}

/**
 * Batch multiple deferred operations
 */
export function batchDeferredWork(callbacks: Array<() => void>, staggerMs = 100): void {
  callbacks.forEach((cb, index) => {
    deferWork(() => {
      setTimeout(cb, index * staggerMs);
    });
  });
}

/**
 * Preload an image in the background
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Preload multiple images with priority queue
 */
export async function preloadImages(
  srcs: string[], 
  options: { concurrent?: number; priority?: 'high' | 'low' } = {}
): Promise<void> {
  const { concurrent = 3, priority = 'low' } = options;
  
  // For slow connections, reduce concurrency
  const actualConcurrent = isSlowConnection() ? 1 : concurrent;
  
  // Use low priority loading for non-critical images
  if (priority === 'low') {
    await new Promise(resolve => deferWork(() => resolve(undefined)));
  }
  
  const chunks: string[][] = [];
  for (let i = 0; i < srcs.length; i += actualConcurrent) {
    chunks.push(srcs.slice(i, i + actualConcurrent));
  }
  
  for (const chunk of chunks) {
    await Promise.allSettled(chunk.map(preloadImage));
  }
}

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
 * Schedule critical vs non-critical initialization
 */
export function scheduleInitialization(
  critical: () => void,
  deferred: Array<{ fn: () => void; delay?: number }>
): void {
  // Run critical initialization immediately
  critical();
  
  // Defer non-critical work
  deferred.forEach(({ fn, delay = 0 }, index) => {
    const effectiveDelay = delay + (index * 50);
    
    if (effectiveDelay === 0) {
      deferWork(fn);
    } else {
      setTimeout(() => deferWork(fn), effectiveDelay);
    }
  });
}

/**
 * Resource hints for faster loading
 */
export function addResourceHints(hints: Array<{ href: string; as?: string; type?: 'preload' | 'prefetch' | 'preconnect' }>): void {
  hints.forEach(({ href, as, type = 'prefetch' }) => {
    // Check if hint already exists
    const existing = document.querySelector(`link[href="${href}"]`);
    if (existing) return;
    
    const link = document.createElement('link');
    link.rel = type;
    link.href = href;
    if (as) link.as = as;
    link.crossOrigin = 'anonymous';
    
    document.head.appendChild(link);
  });
}

/**
 * Adaptive loading based on connection
 */
export function getAdaptiveLoadingConfig(): {
  imageConcurrency: number;
  preloadCount: number;
  animationsEnabled: boolean;
  lazyLoadThreshold: string;
} {
  const slow = isSlowConnection();
  const reducedData = prefersReducedData();
  
  return {
    imageConcurrency: slow || reducedData ? 1 : 4,
    preloadCount: slow || reducedData ? 1 : 3,
    animationsEnabled: !slow && !reducedData,
    lazyLoadThreshold: slow ? '100px' : '300px',
  };
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
