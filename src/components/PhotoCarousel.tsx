import { useState, useCallback, useRef, useEffect, memo } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
}

// Memoized lazy loading image component with blur placeholder
const LazyImage = memo(({ src, alt, className }: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

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
        rootMargin: "150px",
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
  }, []);

  return (
    <div ref={imgRef} className={cn("relative overflow-hidden bg-card-foreground/10", className)}>
      {isInView && !hasError && (
        <>
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0"
            )}
          />
          {!isLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5 animate-shimmer" />
          )}
        </>
      )}
      {(!isInView || hasError) && (
        <div className="absolute inset-0 bg-card-foreground/10" />
      )}
    </div>
  );
});

LazyImage.displayName = "LazyImage";

interface PhotoCarouselProps {
  photos: string[];
  avatarUrl?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
  showDots?: boolean;
  showArrows?: boolean;
  className?: string;
  onClick?: () => void;
  lazy?: boolean;
}

// Memoized navigation button component
const NavButton = memo(({ 
  direction, 
  onClick 
}: { 
  direction: "prev" | "next"; 
  onClick: (e: React.MouseEvent) => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10",
      direction === "prev" ? "left-1" : "right-1"
    )}
  >
    {direction === "prev" ? (
      <ChevronLeft className="w-4 h-4 text-foreground" />
    ) : (
      <ChevronRight className="w-4 h-4 text-foreground" />
    )}
  </button>
));

NavButton.displayName = "NavButton";

// Memoized dots indicator with animation
const DotsIndicator = memo(({ 
  total, 
  currentIndex 
}: { 
  total: number; 
  currentIndex: number;
}) => (
  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
    {Array.from({ length: total }).map((_, index) => (
      <motion.div
        key={index}
        className="h-1.5 rounded-full bg-background/60"
        animate={{
          width: index === currentIndex ? 12 : 6,
          backgroundColor: index === currentIndex ? "hsl(var(--primary))" : "hsl(var(--background) / 0.6)",
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    ))}
  </div>
));

DotsIndicator.displayName = "DotsIndicator";

// Memoized photo counter badge
const PhotoCounter = memo(({ current, total }: { current: number; total: number }) => (
  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm text-xs font-body text-foreground z-10">
    {current}/{total}
  </div>
));

PhotoCounter.displayName = "PhotoCounter";

const SIZE_CLASSES = {
  sm: "w-16 h-16",
  md: "w-32 h-40",
  lg: "w-full aspect-[4/5]",
} as const;

const SIZE_TEXT_CLASSES = {
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-5xl",
} as const;

// Swipe threshold for navigation (in pixels)
const SWIPE_THRESHOLD = 50;
const SWIPE_VELOCITY_THRESHOLD = 500;

const PhotoCarousel = memo(({
  photos,
  avatarUrl,
  name,
  size = "md",
  showDots = true,
  showArrows = true,
  className,
  onClick,
  lazy = true,
}: PhotoCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    dragFree: false,
    skipSnaps: false,
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInView, setIsInView] = useState(!lazy);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Motion values for gesture feedback
  const dragX = useMotionValue(0);
  const dragOpacity = useTransform(dragX, [-100, 0, 100], [0.7, 1, 0.7]);
  const dragScale = useTransform(dragX, [-100, 0, 100], [0.98, 1, 0.98]);

  // Memoize allPhotos to prevent recalculation
  const allPhotos = photos.length > 0 ? photos : avatarUrl ? [avatarUrl] : [];

  // Intersection observer for lazy loading
  useEffect(() => {
    if (!lazy) return;

    const currentRef = containerRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "200px",
        threshold: 0,
      }
    );

    observer.observe(currentRef);

    return () => observer.disconnect();
  }, [lazy]);

  const scrollPrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    emblaApi?.scrollPrev();
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, [emblaApi]);

  const scrollNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    emblaApi?.scrollNext();
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Handle pan gesture for enhanced swipe
  const handlePanStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handlePan = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    dragX.set(info.offset.x);
  }, [dragX]);

  const handlePanEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    
    const { offset, velocity } = info;
    const swipe = Math.abs(offset.x) > SWIPE_THRESHOLD || Math.abs(velocity.x) > SWIPE_VELOCITY_THRESHOLD;
    
    if (swipe) {
      if (offset.x > 0 || velocity.x > SWIPE_VELOCITY_THRESHOLD) {
        scrollPrev();
      } else {
        scrollNext();
      }
    }
    
    // Animate back to center
    animate(dragX, 0, { type: "spring", stiffness: 500, damping: 30 });
  }, [dragX, scrollPrev, scrollNext]);

  // Check if slide should be loaded (current + adjacent for performance)
  const shouldLoadSlide = useCallback((index: number) => {
    const photoCount = allPhotos.length;
    if (photoCount <= 3) return true;
    
    const diff = Math.abs(index - currentIndex);
    const wrappedDiff = Math.min(diff, photoCount - diff);
    return wrappedDiff <= 1;
  }, [currentIndex, allPhotos.length]);

  // Placeholder component
  const Placeholder = (
    <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/30 via-primary/20 to-accent/30 bg-[length:200%_200%] animate-gradient-shift" />
      <span className={cn("text-card-foreground/70 font-display font-semibold relative z-10 drop-shadow-sm", SIZE_TEXT_CLASSES[size])}>
        {(name?.[0] || "?").toUpperCase()}
      </span>
    </div>
  );

  // No photos - show placeholder with initial
  if (allPhotos.length === 0) {
    return (
      <div 
        ref={containerRef}
        className={cn(
          "rounded-xl flex items-center justify-center overflow-hidden relative ring-2 ring-primary/30 animate-glow",
          SIZE_CLASSES[size],
          className
        )}
        onClick={onClick}
      >
        {Placeholder}
      </div>
    );
  }

  // Single photo - no carousel needed
  if (allPhotos.length === 1) {
    return (
      <div 
        ref={containerRef}
        className={cn(
          "rounded-xl overflow-hidden",
          SIZE_CLASSES[size],
          className
        )}
        onClick={onClick}
      >
        {isInView ? (
          <LazyImage
            src={allPhotos[0]}
            alt={name || "Foto"}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full bg-card-foreground/10" />
        )}
      </div>
    );
  }

  // Multiple photos - show carousel with enhanced gestures
  return (
    <motion.div 
      ref={containerRef}
      className={cn(
        "relative rounded-xl overflow-hidden group touch-pan-y",
        SIZE_CLASSES[size],
        className
      )}
      onClick={!isDragging ? onClick : undefined}
      style={{ opacity: dragOpacity, scale: dragScale }}
      onPanStart={handlePanStart}
      onPan={handlePan}
      onPanEnd={handlePanEnd}
    >
      {isInView ? (
        <>
          <div className="overflow-hidden h-full" ref={emblaRef}>
            <div className="flex h-full">
              {allPhotos.map((photo, index) => (
                <motion.div 
                  key={photo} 
                  className="flex-[0_0_100%] min-w-0 h-full"
                  animate={{
                    scale: index === currentIndex ? 1 : 0.95,
                    opacity: index === currentIndex ? 1 : 0.8,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {shouldLoadSlide(index) ? (
                    <LazyImage
                      src={photo}
                      alt={`${name || "Foto"} ${index + 1}`}
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-card-foreground/10" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Swipe hint indicator - shows briefly on first view */}
          {currentIndex === 0 && allPhotos.length > 1 && (
            <motion.div
              className="absolute inset-0 pointer-events-none flex items-center justify-center"
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 0 }}
              transition={{ delay: 1.5, duration: 0.5 }}
            >
              <motion.div
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-background/60 backdrop-blur-sm"
                initial={{ x: 0 }}
                animate={{ x: [0, -10, 10, 0] }}
                transition={{ 
                  duration: 1, 
                  delay: 0.5,
                  times: [0, 0.33, 0.66, 1],
                  ease: "easeInOut"
                }}
              >
                <ChevronLeft className="w-3 h-3 text-foreground/70" />
                <span className="text-xs font-body text-foreground/70">Desliza</span>
                <ChevronRight className="w-3 h-3 text-foreground/70" />
              </motion.div>
            </motion.div>
          )}

          {showArrows && (
            <>
              <NavButton direction="prev" onClick={scrollPrev} />
              <NavButton direction="next" onClick={scrollNext} />
            </>
          )}

          {showDots && <DotsIndicator total={allPhotos.length} currentIndex={currentIndex} />}

          <PhotoCounter current={currentIndex + 1} total={allPhotos.length} />
        </>
      ) : (
        Placeholder
      )}
    </motion.div>
  );
});

PhotoCarousel.displayName = "PhotoCarousel";

export default PhotoCarousel;
