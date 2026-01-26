/**
 * Resource hints for faster loading (preload, prefetch, preconnect).
 */

export interface ResourceHint {
  href: string;
  as?: string;
  type?: 'preload' | 'prefetch' | 'preconnect';
}

/**
 * Add resource hints to the document head
 */
export function addResourceHints(hints: ResourceHint[]): void {
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
