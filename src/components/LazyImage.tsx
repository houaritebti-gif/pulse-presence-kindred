import { useState, useRef, useEffect, memo } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  placeholderClassName?: string;
  /** Use circular skeleton for avatars */
  isCircular?: boolean;
}

const LazyImage = memo(({ 
  src, 
  alt, 
  className, 
  onClick, 
  placeholderClassName,
  isCircular = false 
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "100px",
        threshold: 0.1,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <div ref={imgRef} className={cn("relative overflow-hidden", placeholderClassName)}>
      {/* Shimmer skeleton placeholder */}
      {!isLoaded && (
        <Skeleton 
          variant={isCircular ? "circular" : "default"}
          className={cn(
            "absolute inset-0 w-full h-full",
            placeholderClassName
          )} 
        />
      )}

      {/* Actual image - only load when in view */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={cn(
            "transition-opacity duration-300 ease-out",
            isLoaded ? "opacity-100" : "opacity-0",
            hasError && "hidden",
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          onClick={onClick}
          loading="lazy"
          decoding="async"
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground text-xs",
          isCircular && "rounded-full",
          placeholderClassName
        )}>
          Error al cargar
        </div>
      )}
    </div>
  );
});

LazyImage.displayName = "LazyImage";

export default LazyImage;
