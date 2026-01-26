/**
 * Image preloading utilities with priority queue support.
 */

import { isSlowConnection } from './connectionUtils';
import { deferWork } from './deferredExecution';

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
