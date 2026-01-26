/**
 * Deferred and idle-time execution utilities.
 */

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
