import { useState, useRef, useEffect, memo } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  aspectRatio?: "square" | "video" | "portrait";
  /** Use circular skeleton for avatars */
  isCircular?: boolean;
}

export const OptimizedImage = memo(({
  src,
  alt,
  className,
  fallback = "/placeholder.svg",
  aspectRatio = "square",
  isCircular = false,
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete) {
      setIsLoaded(true);
    }
  }, []);

  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
  };

  return (
    <div className={cn(
      "relative overflow-hidden bg-muted", 
      aspectClasses[aspectRatio], 
      isCircular && "rounded-full",
      className
    )}>
      {/* Shimmer skeleton loader */}
      {!isLoaded && !hasError && (
        <Skeleton 
          variant={isCircular ? "circular" : "default"}
          className="absolute inset-0 w-full h-full" 
        />
      )}
      
      <img
        ref={imgRef}
        src={hasError ? fallback : src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300 ease-out",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
});

OptimizedImage.displayName = "OptimizedImage";
