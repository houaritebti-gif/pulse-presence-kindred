import { useState, useRef, useEffect, memo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BlurPlaceholderImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderColor?: string;
  /** Use circular placeholder for avatars */
  isCircular?: boolean;
  /** Enable blur-up transition effect */
  enableBlurUp?: boolean;
  onClick?: () => void;
}

/**
 * Image component with blur placeholder effect
 * Shows a blurred low-resolution placeholder while loading,
 * then smoothly transitions to the full image
 */
export const BlurPlaceholderImage = memo(({
  src,
  alt,
  className,
  placeholderColor = "hsl(var(--muted))",
  isCircular = false,
  enableBlurUp = true,
  onClick,
}: BlurPlaceholderImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const [blurDataUrl, setBlurDataUrl] = useState<string | null>(null);

  // Generate a tiny blur placeholder using canvas
  useEffect(() => {
    if (!enableBlurUp || !src || hasError) return;
    
    // Create a small canvas for blur placeholder
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Create a very small version (4x4 pixels)
        const size = 4;
        canvas.width = size;
        canvas.height = size;
        
        ctx.drawImage(img, 0, 0, size, size);
        setBlurDataUrl(canvas.toDataURL('image/jpeg', 0.1));
      } catch (e) {
        // CORS issues - just use color placeholder
      }
    };
    
    img.onerror = () => {
      // Can't load image for placeholder, use color
    };
    
    img.src = src;
  }, [src, enableBlurUp, hasError]);

  // Intersection observer for lazy loading
  useEffect(() => {
    const currentRef = imgRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "200px", // Load images 200px before they enter viewport
        threshold: 0,
      }
    );

    observer.observe(currentRef);
    return () => observer.disconnect();
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(true);
  }, []);

  return (
    <div 
      ref={imgRef} 
      className={cn(
        "relative overflow-hidden bg-muted",
        isCircular && "rounded-full",
        className
      )}
      onClick={onClick}
      style={{ backgroundColor: placeholderColor }}
    >
      {/* Blur placeholder layer */}
      {!isLoaded && !hasError && (
        <div 
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundImage: blurDataUrl ? `url(${blurDataUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(20px)',
            transform: 'scale(1.2)', // Prevent blur edges from showing
          }}
        />
      )}
      
      {/* Shimmer animation overlay */}
      {!isLoaded && !hasError && (
        <div 
          className={cn(
            "absolute inset-0 overflow-hidden",
            isCircular && "rounded-full"
          )}
        >
          <div 
            className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-foreground/5 to-transparent dark:via-foreground/10"
          />
        </div>
      )}

      {/* Actual image */}
      {isInView && (
        <motion.img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          initial={enableBlurUp ? { opacity: 0, filter: "blur(10px)" } : { opacity: 0 }}
          animate={isLoaded && !hasError ? { opacity: 1, filter: "blur(0px)" } : {}}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={cn(
            "w-full h-full object-cover",
            !isLoaded && "opacity-0"
          )}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div 
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-xs",
            isCircular && "rounded-full"
          )}
        >
          <svg 
            className="w-8 h-8 text-muted-foreground/50" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
        </div>
      )}
    </div>
  );
});

BlurPlaceholderImage.displayName = "BlurPlaceholderImage";

export default BlurPlaceholderImage;
