import { useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoCarouselProps {
  photos: string[];
  avatarUrl?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
  showDots?: boolean;
  showArrows?: boolean;
  className?: string;
  onClick?: () => void;
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
}: PhotoCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [currentIndex, setCurrentIndex] = useState(0);

  // Combine avatar with photos if no photos exist
  const allPhotos = photos.length > 0 ? photos : avatarUrl ? [avatarUrl] : [];

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
  emblaApi?.on("select", onSelect);

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-32 h-40",
    lg: "w-full aspect-[4/5]",
  };

  // If no photos at all, show placeholder
  if (allPhotos.length === 0) {
    return (
      <div 
        className={cn(
          "rounded-xl bg-card-foreground/10 flex items-center justify-center",
          sizeClasses[size],
          className
        )}
        onClick={onClick}
      >
        <span className="text-card-foreground/40 font-display text-2xl">
          {(name?.[0] || "?").toUpperCase()}
        </span>
      </div>
    );
  }

  // Single photo - no carousel needed
  if (allPhotos.length === 1) {
    return (
      <div 
        className={cn(
          "rounded-xl overflow-hidden",
          sizeClasses[size],
          className
        )}
        onClick={onClick}
      >
        <img
          src={allPhotos[0]}
          alt={name || "Foto"}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Multiple photos - show carousel
  return (
    <div 
      className={cn(
        "relative rounded-xl overflow-hidden group",
        sizeClasses[size],
        className
      )}
      onClick={onClick}
    >
      <div className="overflow-hidden h-full" ref={emblaRef}>
        <div className="flex h-full">
          {allPhotos.map((photo, index) => (
            <div 
              key={index} 
              className="flex-[0_0_100%] min-w-0 h-full"
            >
              <img
                src={photo}
                alt={`${name || "Foto"} ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      {showArrows && allPhotos.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
          >
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
          >
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {showDots && allPhotos.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
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
      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm text-xs font-body text-foreground">
        {currentIndex + 1}/{allPhotos.length}
      </div>
    </div>
  );
};

export default PhotoCarousel;
