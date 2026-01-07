import { useState, useCallback, useRef, useEffect, memo } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { motion, useMotionValue, useTransform, animate, PanInfo, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ZoomIn, Grid3X3, Play, Pause } from "lucide-react";
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

type SlideshowTransition = "fade" | "slide" | "zoom" | "crossfade";

interface PhotoCarouselProps {
  photos: string[];
  avatarUrl?: string | null;
  name?: string | null;
  profileId?: string;
  size?: "sm" | "md" | "lg";
  showDots?: boolean;
  showArrows?: boolean;
  className?: string;
  onClick?: () => void;
  lazy?: boolean;
  enableZoom?: boolean;
  enableGallery?: boolean;
  enableSlideshow?: boolean;
  enableSharedTransition?: boolean;
  slideshowInterval?: number;
  slideshowTransition?: SlideshowTransition;
}

// Slideshow progress bar component
const SlideshowProgress = memo(({ 
  isPlaying, 
  progress,
  onToggle 
}: { 
  isPlaying: boolean; 
  progress: number;
  onToggle: () => void;
}) => (
  <div className="absolute bottom-0 left-0 right-0 z-20">
    {/* Progress bar */}
    <div className="h-0.5 bg-background/30">
      <motion.div
        className="h-full bg-primary"
        initial={{ width: "0%" }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.1, ease: "linear" }}
      />
    </div>
  </div>
));

SlideshowProgress.displayName = "SlideshowProgress";

// Play/Pause button component
const SlideshowButton = memo(({ 
  isPlaying, 
  onToggle 
}: { 
  isPlaying: boolean; 
  onToggle: () => void;
}) => (
  <motion.button
    onClick={(e) => {
      e.stopPropagation();
      onToggle();
    }}
    className="absolute top-2 left-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center z-20 hover:bg-background transition-colors"
    whileTap={{ scale: 0.9 }}
  >
    <AnimatePresence mode="wait">
      {isPlaying ? (
        <motion.div
          key="pause"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Pause className="w-4 h-4 text-foreground" />
        </motion.div>
      ) : (
        <motion.div
          key="play"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Play className="w-4 h-4 text-foreground ml-0.5" />
        </motion.div>
      )}
    </AnimatePresence>
  </motion.button>
));

SlideshowButton.displayName = "SlideshowButton";

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
    aria-label={direction === "prev" ? "Foto anterior" : "Foto siguiente"}
    className={cn(
      "absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity shadow-md z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
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
    aria-label={`Ver galería de fotos, foto ${current} de ${total}`}
    className={cn(
      "absolute top-2 right-2 px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm text-xs font-body text-foreground z-10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
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
  lg: "w-full aspect-[3/4] sm:aspect-[4/5]",
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
  profileId,
  size = "md",
  showDots = true,
  showArrows = true,
  className,
  onClick,
  lazy = true,
  enableZoom = true,
  enableGallery = true,
  enableSlideshow = true,
  enableSharedTransition = true,
  slideshowInterval = 4000,
  slideshowTransition = "crossfade",
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
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState(false);
  const [slideshowProgress, setSlideshowProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideshowTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Motion values for gesture feedback
  const dragX = useMotionValue(0);
  const dragOpacity = useTransform(dragX, [-100, 0, 100], [0.7, 1, 0.7]);
  const dragScale = useTransform(dragX, [-100, 0, 100], [0.98, 1, 0.98]);

  // Memoize allPhotos to prevent recalculation
  const allPhotos = photos.length > 0 ? photos : avatarUrl ? [avatarUrl] : [];

  // Slideshow logic
  const startSlideshow = useCallback(() => {
    if (allPhotos.length <= 1) return;
    
    setIsSlideshowPlaying(true);
    setSlideshowProgress(0);
    
    // Progress update interval (update every 50ms for smooth progress)
    const progressStep = (50 / slideshowInterval) * 100;
    progressIntervalRef.current = setInterval(() => {
      setSlideshowProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + progressStep;
      });
    }, 50);
    
    // Auto-advance timer
    slideshowTimerRef.current = setInterval(() => {
      emblaApi?.scrollNext();
      setSlideshowProgress(0);
    }, slideshowInterval);
    
    if (navigator.vibrate) navigator.vibrate(15);
  }, [allPhotos.length, slideshowInterval, emblaApi]);

  const stopSlideshow = useCallback(() => {
    setIsSlideshowPlaying(false);
    setSlideshowProgress(0);
    
    if (slideshowTimerRef.current) {
      clearInterval(slideshowTimerRef.current);
      slideshowTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const toggleSlideshow = useCallback(() => {
    if (isSlideshowPlaying) {
      stopSlideshow();
    } else {
      startSlideshow();
    }
  }, [isSlideshowPlaying, startSlideshow, stopSlideshow]);

  // Pause slideshow on interaction
  useEffect(() => {
    if (isZoomed || isGalleryOpen || isDragging) {
      stopSlideshow();
    }
  }, [isZoomed, isGalleryOpen, isDragging, stopSlideshow]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (slideshowTimerRef.current) clearInterval(slideshowTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  // Reset progress on manual slide change
  useEffect(() => {
    if (isSlideshowPlaying) {
      setSlideshowProgress(0);
      
      // Reset timers
      if (slideshowTimerRef.current) clearInterval(slideshowTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      
      const progressStep = (50 / slideshowInterval) * 100;
      progressIntervalRef.current = setInterval(() => {
        setSlideshowProgress((prev) => {
          if (prev >= 100) return 0;
          return prev + progressStep;
        });
      }, 50);
      
      slideshowTimerRef.current = setInterval(() => {
        emblaApi?.scrollNext();
        setSlideshowProgress(0);
      }, slideshowInterval);
    }
  }, [currentIndex, isSlideshowPlaying, slideshowInterval, emblaApi]);

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
    const nextNextIndex = (currentIndex + 2) % allPhotos.length;
    
    preloadImage(allPhotos[currentIndex]);
    preloadImage(allPhotos[prevIndex]);
    preloadImage(allPhotos[nextIndex]);
    
    // Preload one more ahead for smoother experience
    if (allPhotos.length > 3) {
      preloadImage(allPhotos[nextNextIndex]);
    }
  }, [currentIndex, allPhotos, preloadImage]);
  
  // Preload all images on initial mount after a short delay (for better UX)
  useEffect(() => {
    if (!isInView || allPhotos.length <= 1) return;
    
    const timer = setTimeout(() => {
      allPhotos.forEach(photo => preloadImage(photo));
    }, 500);
    
    return () => clearTimeout(timer);
  }, [isInView, allPhotos, preloadImage]);

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
              {allPhotos.map((photo, index) => {
                const isActive = index === currentIndex;
                
                // Transition variants based on slideshowTransition prop
                const getTransitionVariants = () => {
                  if (!isSlideshowPlaying) {
                    // Default embla transition when not in slideshow mode
                    return {
                      scale: isActive ? 1 : 0.95,
                      opacity: isActive ? 1 : 0.8,
                    };
                  }
                  
                  switch (slideshowTransition) {
                    case "fade":
                      return {
                        opacity: isActive ? 1 : 0,
                        scale: 1,
                      };
                    case "zoom":
                      return {
                        opacity: isActive ? 1 : 0,
                        scale: isActive ? 1 : 1.15,
                      };
                    case "slide":
                      return {
                        opacity: isActive ? 1 : 0.5,
                        x: isActive ? 0 : index < currentIndex ? -20 : 20,
                        scale: isActive ? 1 : 0.9,
                      };
                    case "crossfade":
                    default:
                      return {
                        opacity: isActive ? 1 : 0,
                        scale: isActive ? 1 : 1.05,
                        filter: isActive ? "blur(0px)" : "blur(2px)",
                      };
                  }
                };

                const getTransitionConfig = () => {
                  if (!isSlideshowPlaying) {
                    return { duration: 0.2 };
                  }
                  
                  switch (slideshowTransition) {
                    case "fade":
                      return { duration: 0.6 };
                    case "zoom":
                      return { duration: 0.8, type: "tween" as const };
                    case "slide":
                      return { duration: 0.5, type: "tween" as const };
                    case "crossfade":
                    default:
                      return { duration: 0.7 };
                  }
                };

                return (
                  <motion.div 
                    key={photo} 
                    className="flex-[0_0_100%] min-w-0 h-full"
                    animate={getTransitionVariants()}
                    transition={getTransitionConfig()}
                    style={{
                      position: isSlideshowPlaying && slideshowTransition !== "slide" ? "absolute" : "relative",
                      inset: isSlideshowPlaying && slideshowTransition !== "slide" ? 0 : undefined,
                      zIndex: isActive ? 10 : 0,
                    }}
                  >
                    {shouldLoadSlide(index) ? (
                      enableZoom && size === "lg" ? (
                        <ZoomableImage
                          src={photo}
                          alt={`${name || "Foto"} ${index + 1}`}
                          className="w-full h-full"
                          isActive={isActive}
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
                );
              })}
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
                <ChevronLeft className="w-3 h-3 text-foreground/85" />
                <span className="text-xs font-body text-foreground/85">Desliza</span>
                <ChevronRight className="w-3 h-3 text-foreground/85" />
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
                <ZoomIn className="w-3 h-3 text-foreground/85" />
                <span className="text-xs font-body text-foreground/85">Pellizca para zoom</span>
              </div>
            </motion.div>
          )}

          {showArrows && !isZoomed && !isSlideshowPlaying && (
            <>
              <NavButton direction="prev" onClick={scrollPrev} />
              <NavButton direction="next" onClick={scrollNext} />
            </>
          )}

          {showDots && !isZoomed && !isSlideshowPlaying && <DotsIndicator total={allPhotos.length} currentIndex={currentIndex} />}

          {!isZoomed && !isSlideshowPlaying && (
            <PhotoCounter 
              current={currentIndex + 1} 
              total={allPhotos.length}
              onClick={enableGallery && allPhotos.length > 1 ? () => setIsGalleryOpen(true) : undefined}
              showGalleryHint={enableGallery && allPhotos.length > 1}
            />
          )}

          {/* Slideshow controls */}
          {enableSlideshow && allPhotos.length > 1 && !isZoomed && (
            <>
              <SlideshowButton isPlaying={isSlideshowPlaying} onToggle={toggleSlideshow} />
              {isSlideshowPlaying && (
                <SlideshowProgress 
                  isPlaying={isSlideshowPlaying} 
                  progress={slideshowProgress}
                  onToggle={toggleSlideshow}
                />
              )}
              {/* Photo counter during slideshow */}
              {isSlideshowPlaying && (
                <motion.div 
                  className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm text-xs font-body text-foreground z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {currentIndex + 1}/{allPhotos.length}
                </motion.div>
              )}
            </>
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
