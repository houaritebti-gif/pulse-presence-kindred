import { lazy, ComponentType } from 'react';

type ComponentFactory<T> = () => Promise<{ default: T }>;

// Track failed imports to avoid infinite retry loops
const failedImports = new Set<string>();
const importAttempts = new Map<string, number>();

/**
 * Lazy load a component with automatic retry on failure.
 * This helps on mobile devices where network can be flaky and
 * dynamic imports sometimes fail.
 * 
 * Features:
 * - Exponential backoff between retries
 * - Cache busting on retry
 * - Tracks failed imports to prevent infinite loops
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: ComponentFactory<T>,
  retries = 5,
  baseInterval = 500
): React.LazyExoticComponent<T> {
  // Create a stable key for this factory
  const factoryKey = factory.toString().slice(0, 100);
  
  return lazy(async () => {
    let lastError: Error | undefined;
    
    // Get current attempt count
    const currentAttempts = importAttempts.get(factoryKey) || 0;
    
    // If we've already exhausted all retries for this module, try one more time with cache bust
    if (failedImports.has(factoryKey)) {
      failedImports.delete(factoryKey);
      importAttempts.delete(factoryKey);
    }
    
    for (let i = 0; i < retries; i++) {
      try {
        // Track attempt
        importAttempts.set(factoryKey, currentAttempts + i + 1);
        
        const module = await factory();
        
        // Success - clear tracking
        importAttempts.delete(factoryKey);
        failedImports.delete(factoryKey);
        
        return module;
      } catch (error) {
        lastError = error as Error;
        
        // Check if it's a network/chunk loading error
        const isChunkError = isChunkLoadError(error);
        
        if (isChunkError && i < retries - 1) {
          // Calculate exponential backoff with jitter
          const delay = baseInterval * Math.pow(2, i) + Math.random() * 200;
          console.log(`[LazyWithRetry] Retry ${i + 1}/${retries} after ${Math.round(delay)}ms`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // On later retries, try to clear module cache
          if (i >= 2) {
            await clearModuleCache();
          }
          
          continue;
        }
        
        // If not a chunk error, throw immediately
        if (!isChunkError) {
          throw error;
        }
      }
    }
    
    // Mark as failed for future reference
    failedImports.add(factoryKey);
    
    // Log final failure
    console.error('[LazyWithRetry] All retries failed', lastError);
    
    // Store flag for UI feedback
    sessionStorage.setItem('chunk-load-error', 'true');
    sessionStorage.setItem('chunk-load-error-time', Date.now().toString());
    
    throw lastError;
  });
}

/**
 * Check if an error is a chunk loading error
 */
function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();
  
  return (
    message.includes('failed to fetch dynamically imported module') ||
    message.includes('loading chunk') ||
    message.includes('loading css chunk') ||
    message.includes('chunkloaderror') ||
    message.includes('failed to fetch') ||
    message.includes('network error') ||
    message.includes('load failed') ||
    name.includes('chunkloaderror') ||
    // Vite-specific errors
    message.includes('error loading dynamically imported module') ||
    // Safari-specific
    message.includes('cancelled') ||
    // General fetch failures
    (message.includes('fetch') && message.includes('fail'))
  );
}

/**
 * Try to clear cached modules
 */
async function clearModuleCache(): Promise<void> {
  if ('caches' in window) {
    try {
      const names = await caches.keys();
      const moduleCaches = names.filter(
        name => name.includes('module') || name.includes('vite') || name.includes('workbox')
      );
      await Promise.all(moduleCaches.map(name => caches.delete(name)));
      console.log('[LazyWithRetry] Cleared module caches');
    } catch (e) {
      // Ignore cache clearing errors
    }
  }
}

/**
 * Check if there was a recent chunk loading error
 */
export function hadChunkLoadError(): boolean {
  const hadError = sessionStorage.getItem('chunk-load-error') === 'true';
  const errorTime = sessionStorage.getItem('chunk-load-error-time');
  
  if (hadError) {
    // Clear the flag
    sessionStorage.removeItem('chunk-load-error');
    sessionStorage.removeItem('chunk-load-error-time');
    
    // Only consider errors from the last minute as relevant
    if (errorTime) {
      const elapsed = Date.now() - parseInt(errorTime, 10);
      return elapsed < 60000;
    }
    return true;
  }
  
  return false;
}

/**
 * Preload a route to improve navigation performance
 */
export function preloadRoute(factory: ComponentFactory<unknown>): void {
  // Start loading the module in the background
  factory().catch(() => {
    // Silently ignore preload failures
  });
}

/**
 * Preload critical routes after authentication
 * Call this after user logs in to pre-fetch likely next pages
 */
export function preloadCriticalRoutes(): void {
  // Use requestIdleCallback for non-blocking preload
  const preload = () => {
    // Most likely routes after login
    import('@/pages/Presence').catch(() => {});
    import('@/pages/Profile').catch(() => {});
    import('@/pages/Sparks').catch(() => {});
  };

  if ('requestIdleCallback' in window) {
    (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(preload);
  } else {
    setTimeout(preload, 200);
  }
}
