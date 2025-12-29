import { useState, useCallback, useRef, useEffect, memo } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, ZoomIn, Grid3X3 } from "lucide-react";
import { cn } from "@/lib/utils";
import PhotoGalleryGrid from "./PhotoGalleryGrid";

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

// Zoomable image component with pinch-to-zoom and double-tap
interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
  isActive: boolean;
  onZoomChange?: (isZoomed: boolean) => void;
}

const ZoomableImage = memo(({ src, alt, className, isActive, onZoomChange }: ZoomableImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Zoom and pan state
  const scale = useMotionValue(1);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const lastTapRef = useRef<number>(0);
  const initialDistanceRef = useRef<number>(0);
  const initialScaleRef = useRef<number>(1);

  // Reset zoom when slide becomes inactive
  useEffect(() => {
    if (!isActive && isZoomed) {
      animate(scale, 1, { duration: 0.3 });
      animate(x, 0, { duration: 0.3 });
      animate(y, 0, { duration: 0.3 });
      setIsZoomed(false);
      onZoomChange?.(false);
    }
  }, [isActive, isZoomed, scale, x, y, onZoomChange]);

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
      { rootMargin: "150px", threshold: 0 }
    );

    observer.observe(currentRef);
    return () => observer.disconnect();
  }, []);

  const handleLoad = useCallback(() => setIsLoaded(true), []);
  const handleError = useCallback(() => setHasError(true), []);

  // Double tap to zoom
  const handleTap = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    
    if (timeSinceLastTap < 300) {
      // Double tap detected
      if (isZoomed) {
        // Zoom out
        animate(scale, 1, { type: "spring", stiffness: 300, damping: 30 });
        animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
        animate(y, 0, { type: "spring", stiffness: 300, damping: 30 });
        setIsZoomed(false);
        onZoomChange?.(false);
      } else {
        // Zoom in
        animate(scale, 2.5, { type: "spring", stiffness: 300, damping: 30 });
        setIsZoomed(true);
        onZoomChange?.(true);
      }
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(15);
    }
    lastTapRef.current = now;
  }, [isZoomed, scale, x, y, onZoomChange]);

  // Handle pinch gesture
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      initialDistanceRef.current = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      initialScaleRef.current = scale.get();
    }
  }, [scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      const scaleFactor = currentDistance / initialDistanceRef.current;
      const newScale = Math.min(Math.max(initialScaleRef.current * scaleFactor, 1), 4);
      scale.set(newScale);
      
      if (newScale > 1 && !isZoomed) {
        setIsZoomed(true);
        onZoomChange?.(true);
      }
    }
  }, [scale, isZoomed, onZoomChange]);

  const handleTouchEnd = useCallback(() => {
    const currentScale = scale.get();
    if (currentScale < 1.1) {
      animate(scale, 1, { type: "spring", stiffness: 300, damping: 30 });
      animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
      animate(y, 0, { type: "spring", stiffness: 300, damping: 30 });
      setIsZoomed(false);
      onZoomChange?.(false);
    } else if (currentScale > 4) {
      animate(scale, 4, { type: "spring", stiffness: 300, damping: 30 });
    }
  }, [scale, x, y, onZoomChange]);

  // Handle pan when zoomed
  const handlePan = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (scale.get() > 1) {
      const currentScale = scale.get();
      const maxPan = (currentScale - 1) * 100;
      
      x.set(Math.min(Math.max(x.get() + info.delta.x, -maxPan), maxPan));
      y.set(Math.min(Math.max(y.get() + info.delta.y, -maxPan), maxPan));
    }
  }, [scale, x, y]);

  const handlePanEnd = useCallback(() => {
    const currentScale = scale.get();
    if (currentScale <= 1) {
      animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
      animate(y, 0, { type: "spring", stiffness: 300, damping: 30 });
    }
  }, [scale, x, y]);

  return (
    <div 
      ref={imgRef} 
      className={cn("relative overflow-hidden bg-card-foreground/10 touch-none", className)}
    >
      {isInView && !hasError ? (
        <motion.div
          ref={containerRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          style={{ scale, x, y }}
          onTap={handleTap}
          onPan={isZoomed ? handlePan : undefined}
          onPanEnd={isZoomed ? handlePanEnd : undefined}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            draggable={false}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300 select-none",
              isLoaded ? "opacity-100" : "opacity-0"
            )}
          />
          {!isLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5 animate-shimmer" />
          )}
        </motion.div>
      ) : (
        <div className="absolute inset-0 bg-card-foreground/10" />
      )}
      
      {/* Zoom indicator */}
      {isZoomed && (
        <motion.div
          className="absolute top-2 left-2 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm text-xs font-body text-foreground flex items-center gap-1 z-20"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <ZoomIn className="w-3 h-3" />
          <span>{Math.round(scale.get() * 100)}%</span>
        </motion.div>
      )}
    </div>
  );
});

ZoomableImage.displayName = "ZoomableImage";

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
  enableZoom?: boolean;
  enableGallery?: boolean;
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

// Memoized photo counter badge - now clickable for gallery
const PhotoCounter = memo(({ 
  current, 
  total,
  onClick,
  showGalleryHint 
}: { 
  current: number; 
  total: number;
  onClick?: () => void;
  showGalleryHint?: boolean;
}) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick?.();
    }}
    className={cn(
      "absolute top-2 right-2 px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm text-xs font-body text-foreground z-10 transition-all",
      onClick && "hover:bg-background hover:scale-105 active:scale-95 cursor-pointer",
      showGalleryHint && "ring-1 ring-primary/50"
    )}
  >
    <span className="flex items-center gap-1">
      {showGalleryHint && <Grid3X3 className="w-3 h-3" />}
      {current}/{total}
    </span>
  </button>
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
  enableZoom = true,
  enableGallery = true,
}: PhotoCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    dragFree: false,
    skipSnaps: false,
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInView, setIsInView] = useState(!lazy);
  const [isDragging, setIsDragging] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Motion values for gesture feedback
  const dragX = useMotionValue(0);
  const dragOpacity = useTransform(dragX, [-100, 0, 100], [0.7, 1, 0.7]);
  const dragScale = useTransform(dragX, [-100, 0, 100], [0.98, 1, 0.98]);

  // Memoize allPhotos to prevent recalculation
  const allPhotos = photos.length > 0 ? photos : avatarUrl ? [avatarUrl] : [];

  // Disable embla dragging when zoomed
  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit({ 
      loop: true,
      watchDrag: !isZoomed,
    });
  }, [emblaApi, isZoomed]);

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
    if (isZoomed) return;
    emblaApi?.scrollPrev();
    if (navigator.vibrate) navigator.vibrate(10);
  }, [emblaApi, isZoomed]);

  const scrollNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isZoomed) return;
    emblaApi?.scrollNext();
    if (navigator.vibrate) navigator.vibrate(10);
  }, [emblaApi, isZoomed]);

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

  // Image preloading cache
  const preloadedImagesRef = useRef<Set<string>>(new Set());
  
  // Preload an image
  const preloadImage = useCallback((src: string) => {
    if (preloadedImagesRef.current.has(src)) return;
    
    const img = new Image();
    img.src = src;
    preloadedImagesRef.current.add(src);
  }, []);

  // Preload adjacent images on mount and index change
  useEffect(() => {
    if (allPhotos.length <= 1) return;
    
    // Preload current, next, and previous
    const prevIndex = (currentIndex - 1 + allPhotos.length) % allPhotos.length;
    const nextIndex = (currentIndex + 1) % allPhotos.length;
    
    preloadImage(allPhotos[currentIndex]);
    preloadImage(allPhotos[prevIndex]);
    preloadImage(allPhotos[nextIndex]);
  }, [currentIndex, allPhotos, preloadImage]);

  // Preload based on swipe direction during drag
  const preloadInDirection = useCallback((direction: "prev" | "next") => {
    if (allPhotos.length <= 1) return;
    
    // Preload 2 images ahead in the direction of swipe
    for (let i = 1; i <= 2; i++) {
      const targetIndex = direction === "next" 
        ? (currentIndex + i) % allPhotos.length
        : (currentIndex - i + allPhotos.length) % allPhotos.length;
      preloadImage(allPhotos[targetIndex]);
    }
  }, [currentIndex, allPhotos, preloadImage]);

  // Handle pan gesture for enhanced swipe
  const handlePanStart = useCallback(() => {
    if (!isZoomed) setIsDragging(true);
  }, [isZoomed]);

  const handlePan = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isZoomed) return;
    
    dragX.set(info.offset.x);
    
    // Preload in the direction of swipe when threshold is approached
    if (Math.abs(info.offset.x) > SWIPE_THRESHOLD * 0.5) {
      preloadInDirection(info.offset.x > 0 ? "prev" : "next");
    }
  }, [dragX, isZoomed, preloadInDirection]);

  const handlePanEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    if (isZoomed) return;
    
    const { offset, velocity } = info;
    const swipe = Math.abs(offset.x) > SWIPE_THRESHOLD || Math.abs(velocity.x) > SWIPE_VELOCITY_THRESHOLD;
    
    if (swipe) {
      if (offset.x > 0 || velocity.x > SWIPE_VELOCITY_THRESHOLD) {
        scrollPrev();
      } else {
        scrollNext();
      }
    }
    
    animate(dragX, 0, { type: "spring", stiffness: 500, damping: 30 });
  }, [dragX, scrollPrev, scrollNext, isZoomed]);

  const handleZoomChange = useCallback((zoomed: boolean) => {
    setIsZoomed(zoomed);
  }, []);

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

  // Single photo - with zoom support
  if (allPhotos.length === 1) {
    return (
      <div 
        ref={containerRef}
        className={cn(
          "rounded-xl overflow-hidden",
          SIZE_CLASSES[size],
          className
        )}
        onClick={!isZoomed ? onClick : undefined}
      >
        {isInView ? (
          enableZoom && size === "lg" ? (
            <ZoomableImage
              src={allPhotos[0]}
              alt={name || "Foto"}
              className="w-full h-full"
              isActive={true}
              onZoomChange={handleZoomChange}
            />
          ) : (
            <LazyImage
              src={allPhotos[0]}
              alt={name || "Foto"}
              className="w-full h-full"
            />
          )
        ) : (
          <div className="w-full h-full bg-card-foreground/10" />
        )}
      </div>
    );
  }

  // Multiple photos - show carousel with enhanced gestures and zoom
  return (
    <motion.div 
      ref={containerRef}
      className={cn(
        "relative rounded-xl overflow-hidden group",
        !isZoomed && "touch-pan-y",
        SIZE_CLASSES[size],
        className
      )}
      onClick={!isDragging && !isZoomed ? onClick : undefined}
      style={{ opacity: isZoomed ? 1 : dragOpacity, scale: isZoomed ? 1 : dragScale }}
      onPanStart={!isZoomed ? handlePanStart : undefined}
      onPan={!isZoomed ? handlePan : undefined}
      onPanEnd={!isZoomed ? handlePanEnd : undefined}
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
                    enableZoom && size === "lg" ? (
                      <ZoomableImage
                        src={photo}
                        alt={`${name || "Foto"} ${index + 1}`}
                        className="w-full h-full"
                        isActive={index === currentIndex}
                        onZoomChange={handleZoomChange}
                      />
                    ) : (
                      <LazyImage
                        src={photo}
                        alt={`${name || "Foto"} ${index + 1}`}
                        className="w-full h-full"
                      />
                    )
                  ) : (
                    <div className="w-full h-full bg-card-foreground/10" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Swipe hint indicator - shows briefly on first view */}
          {currentIndex === 0 && allPhotos.length > 1 && !isZoomed && (
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

          {/* Zoom hint for large size */}
          {enableZoom && size === "lg" && !isZoomed && currentIndex === 0 && (
            <motion.div
              className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none z-10"
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 0 }}
              transition={{ delay: 2, duration: 0.5 }}
            >
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-background/60 backdrop-blur-sm">
                <ZoomIn className="w-3 h-3 text-foreground/70" />
                <span className="text-xs font-body text-foreground/70">Pellizca para zoom</span>
              </div>
            </motion.div>
          )}

          {showArrows && !isZoomed && (
            <>
              <NavButton direction="prev" onClick={scrollPrev} />
              <NavButton direction="next" onClick={scrollNext} />
            </>
          )}

          {showDots && !isZoomed && <DotsIndicator total={allPhotos.length} currentIndex={currentIndex} />}

          {!isZoomed && (
            <PhotoCounter 
              current={currentIndex + 1} 
              total={allPhotos.length}
              onClick={enableGallery && allPhotos.length > 1 ? () => setIsGalleryOpen(true) : undefined}
              showGalleryHint={enableGallery && allPhotos.length > 1}
            />
          )}
        </>
      ) : (
        Placeholder
      )}

      {/* Gallery Grid Modal */}
      {enableGallery && (
        <PhotoGalleryGrid
          photos={allPhotos}
          name={name}
          isOpen={isGalleryOpen}
          onClose={() => setIsGalleryOpen(false)}
          initialIndex={currentIndex}
          onSelectPhoto={(index) => {
            emblaApi?.scrollTo(index);
            setCurrentIndex(index);
          }}
        />
      )}
    </motion.div>
  );
});

PhotoCarousel.displayName = "PhotoCarousel";

export default PhotoCarousel;
