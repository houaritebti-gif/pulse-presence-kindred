/**
 * Critical CSS component that provides essential styles for above-the-fold content.
 * This reduces CLS (Cumulative Layout Shift) and improves FCP (First Contentful Paint).
 */
export const CriticalStyles = () => (
  <style
    dangerouslySetInnerHTML={{
      __html: `
        /* Critical layout styles for immediate render */
        .app-shell {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
        }
        
        /* Skeleton animations for loading states */
        @keyframes skeleton-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        .skeleton-pulse {
          background: linear-gradient(
            90deg,
            hsl(var(--muted)) 25%,
            hsl(var(--muted-foreground) / 0.1) 50%,
            hsl(var(--muted)) 75%
          );
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.5s ease-in-out infinite;
        }
        
        /* Content visibility optimization for below-the-fold */
        .content-visibility-auto {
          content-visibility: auto;
          contain-intrinsic-size: auto 500px;
        }
        
        /* Font loading optimization */
        .font-loading {
          font-display: swap;
        }
        
        /* Reduce motion for users who prefer it */
        @media (prefers-reduced-motion: reduce) {
          .skeleton-pulse {
            animation: none;
            background: hsl(var(--muted));
          }
        }
      `,
    }}
  />
);
