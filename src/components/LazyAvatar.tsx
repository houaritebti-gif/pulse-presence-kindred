import { useState, useRef, useEffect, memo } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface LazyAvatarProps {
  src: string | null | undefined;
  alt?: string;
  fallback?: string;
  className?: string;
  fallbackClassName?: string;
  /** Root margin for IntersectionObserver - larger = earlier load */
  rootMargin?: string;
  /** Apply blur effect to image */
  blur?: boolean;
  onClick?: () => void;
}

/**
 * Optimized lazy-loading avatar for long lists.
 * Uses native IntersectionObserver to defer image loading until visible.
 * Shows shimmer skeleton while loading.
 */
const LazyAvatar = memo(({
  src,
  alt = "Avatar",
  fallback,
  className,
  fallbackClassName,
  rootMargin = "150px",
  blur = false,
  onClick,
}: LazyAvatarProps) => {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || !src) return;

    // Use IntersectionObserver for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold: 0,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [src, rootMargin]);

  // Reset state when src changes
  useEffect(() => {
    if (src) {
      setIsLoaded(false);
      setHasError(false);
    }
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const initial = fallback?.[0]?.toUpperCase() || "?";
  const showFallback = !src || hasError;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Shimmer skeleton while loading */}
      {!isLoaded && !showFallback && (
        <Skeleton 
          variant="circular" 
          className="absolute inset-0 w-full h-full" 
        />
      )}

      {/* Image - only render when in view */}
      {isInView && src && !hasError && (
        <img
          src={src}
          alt={alt}
          className={cn(
            "aspect-square h-full w-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            blur && "blur-[4px]"
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          decoding="async"
        />
      )}

      {/* Fallback */}
      {showFallback && (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground font-display",
            fallbackClassName
          )}
        >
          {initial}
        </div>
      )}
    </div>
  );
});

LazyAvatar.displayName = "LazyAvatar";

export default LazyAvatar;
