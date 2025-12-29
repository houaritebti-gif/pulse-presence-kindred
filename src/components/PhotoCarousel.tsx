import { useState, useCallback, useRef, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
}

// Lazy loading image component with blur placeholder
const LazyImage = ({ src, alt, className }: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "100px", // Start loading 100px before visible
        threshold: 0,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={cn("relative overflow-hidden bg-card-foreground/10", className)}>
      {isInView && (
        <>
          <img
            src={src}
            alt={alt}
            loading="lazy"
            onLoad={() => setIsLoaded(true)}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0"
            )}
          />
          {/* Loading shimmer */}
          {!isLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5 animate-shimmer" />
          )}
        </>
      )}
      {/* Placeholder before in view */}
      {!isInView && (
        <div className="absolute inset-0 bg-card-foreground/10" />
      )}
    </div>
  );
};

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

const PhotoCarousel = ({
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
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInView, setIsInView] = useState(!lazy);
  const containerRef = useRef<HTMLDivElement>(null);

  // Combine avatar with photos if no photos exist
  const allPhotos = photos.length > 0 ? photos : avatarUrl ? [avatarUrl] : [];

  // Intersection observer for the carousel container
  useEffect(() => {
    if (!lazy) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "200px", // Start loading 200px before visible
        threshold: 0,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazy]);

  const scrollPrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (emblaApi) {
      emblaApi.scrollPrev();
      setCurrentIndex(emblaApi.selectedScrollSnap());
    }
  }, [emblaApi]);

  const scrollNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (emblaApi) {
      emblaApi.scrollNext();
      setCurrentIndex(emblaApi.selectedScrollSnap());
    }
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  // Listen to scroll events
  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-32 h-40",
    lg: "w-full aspect-[4/5]",
  };

  // If no photos at all, show placeholder with initial
  if (allPhotos.length === 0) {
    const sizeTextClasses = {
      sm: "text-xl",
      md: "text-3xl",
      lg: "text-5xl",
    };
    
    return (
      <div 
        ref={containerRef}
        className={cn(
          "rounded-xl flex items-center justify-center overflow-hidden relative ring-2 ring-primary/30 animate-glow",
          sizeClasses[size],
          className
        )}
        onClick={onClick}
      >
        <div 
          className="absolute inset-0 bg-gradient-to-br from-accent/30 via-primary/20 to-accent/30 bg-[length:200%_200%] animate-gradient-shift"
        />
        <span className={cn("text-card-foreground/70 font-display font-semibold relative z-10 drop-shadow-sm", sizeTextClasses[size])}>
          {(name?.[0] || "?").toUpperCase()}
        </span>
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
          sizeClasses[size],
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

  // Multiple photos - show carousel
  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative rounded-xl overflow-hidden group",
        sizeClasses[size],
        className
      )}
      onClick={onClick}
    >
      {isInView ? (
        <>
          <div className="overflow-hidden h-full" ref={emblaRef}>
            <div className="flex h-full">
              {allPhotos.map((photo, index) => (
                <div 
                  key={index} 
                  className="flex-[0_0_100%] min-w-0 h-full"
                >
                  {/* Only load current and adjacent slides for performance */}
                  {Math.abs(index - currentIndex) <= 1 || 
                   (currentIndex === 0 && index === allPhotos.length - 1) ||
                   (currentIndex === allPhotos.length - 1 && index === 0) ? (
                    <LazyImage
                      src={photo}
                      alt={`${name || "Foto"} ${index + 1}`}
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-card-foreground/10" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Navigation arrows */}
          {showArrows && allPhotos.length > 1 && (
            <>
              <button
                onClick={scrollPrev}
                className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
              >
                <ChevronLeft className="w-4 h-4 text-foreground" />
              </button>
              <button
                onClick={scrollNext}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
              >
                <ChevronRight className="w-4 h-4 text-foreground" />
              </button>
            </>
          )}

          {/* Dots indicator */}
          {showDots && allPhotos.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {allPhotos.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    index === currentIndex
                      ? "bg-primary w-3"
                      : "bg-background/60"
                  )}
                />
              ))}
            </div>
          )}

          {/* Photo counter badge */}
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm text-xs font-body text-foreground z-10">
            {currentIndex + 1}/{allPhotos.length}
          </div>
        </>
      ) : (
        // Placeholder while not in view - show initial with animated gradient
        <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
          <div 
            className="absolute inset-0 bg-gradient-to-br from-accent/30 via-primary/20 to-accent/30 bg-[length:200%_200%] animate-gradient-shift"
          />
          <span className="text-card-foreground/70 font-display text-3xl font-semibold relative z-10 drop-shadow-sm">
            {(name?.[0] || "?").toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
};

export default PhotoCarousel;
