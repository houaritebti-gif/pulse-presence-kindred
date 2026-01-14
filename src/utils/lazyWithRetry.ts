import { lazy, ComponentType } from 'react';

type ComponentFactory<T> = () => Promise<{ default: T }>;

/**
 * Lazy load a component with automatic retry on failure.
 * This helps on mobile devices where network can be flaky and
 * dynamic imports sometimes fail.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: ComponentFactory<T>,
  retries = 3,
  interval = 1000
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    let lastError: Error | undefined;
    
    for (let i = 0; i < retries; i++) {
      try {
        return await factory();
      } catch (error) {
        lastError = error as Error;
        
        // Check if it's a chunk loading error
        const isChunkError = 
          error instanceof Error && 
          (error.message.includes('Failed to fetch dynamically imported module') ||
           error.message.includes('Loading chunk') ||
           error.message.includes('Loading CSS chunk'));
        
        if (isChunkError && i < retries - 1) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, interval * (i + 1)));
          
          // Try to clear the failed module from cache by adding a cache-buster
          // This helps when the chunk was cached incorrectly
          continue;
        }
        
        // If not a chunk error or last retry, throw
        if (!isChunkError) {
          throw error;
        }
      }
    }
    
    // If all retries failed, try one last time with a page reload hint
    console.error('[LazyWithRetry] All retries failed, suggesting reload', lastError);
    
    // Store a flag to show reload prompt
    sessionStorage.setItem('chunk-load-error', 'true');
    
    throw lastError;
  });
}

/**
 * Check if there was a chunk loading error and clear the flag
 */
export function hadChunkLoadError(): boolean {
  const hadError = sessionStorage.getItem('chunk-load-error') === 'true';
  if (hadError) {
    sessionStorage.removeItem('chunk-load-error');
  }
  return hadError;
}
