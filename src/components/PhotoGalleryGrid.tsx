import { useState, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoGalleryGridProps {
  photos: string[];
  name?: string | null;
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
  onSelectPhoto?: (index: number) => void;
}

// Memoized grid thumbnail
const GridThumbnail = memo(({ 
  src, 
  alt, 
  index, 
  isSelected,
  onClick 
}: { 
  src: string; 
  alt: string; 
  index: number;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <motion.button
      className={cn(
        "relative aspect-square rounded-xl overflow-hidden bg-card-foreground/10 group",
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        className={cn(
          "w-full h-full object-cover transition-all duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          "group-hover:scale-105"
        )}
      />
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5 animate-shimmer" />
      )}
      
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors flex items-center justify-center">
        <ZoomIn className="w-6 h-6 text-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      {/* Photo number */}
      <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center">
        <span className="text-xs font-body text-foreground">{index + 1}</span>
      </div>
    </motion.button>
  );
});

GridThumbnail.displayName = "GridThumbnail";

// Full screen photo viewer
const FullScreenViewer = memo(({
  photos,
  currentIndex,
  onClose,
  onPrev,
  onNext,
  name,
}: {
  photos: string[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  name?: string | null;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <motion.div
      className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-md flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <span className="font-body text-sm text-muted-foreground">
          {currentIndex + 1} / {photos.length}
        </span>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-card hover:bg-card/80 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Photo */}
      <div className="flex-1 flex items-center justify-center px-4 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className="relative max-w-full max-h-full"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <img
              src={photos[currentIndex]}
              alt={`${name || "Foto"} ${currentIndex + 1}`}
              onLoad={() => setIsLoaded(true)}
              className={cn(
                "max-w-full max-h-[70vh] object-contain rounded-xl transition-opacity",
                isLoaded ? "opacity-100" : "opacity-0"
              )}
            />
            {!isLoaded && (
              <div className="absolute inset-0 bg-card-foreground/10 rounded-xl animate-pulse" />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={onPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card hover:bg-card/80 flex items-center justify-center transition-colors shadow-lg"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={onNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card hover:bg-card/80 flex items-center justify-center transition-colors shadow-lg"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      <div className="p-4">
        <div className="flex gap-2 justify-center overflow-x-auto pb-2">
          {photos.map((photo, index) => (
            <button
              key={photo}
              onClick={() => {
                setIsLoaded(false);
                // Use the parent's state through closure
              }}
              className={cn(
                "flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden transition-all",
                index === currentIndex 
                  ? "ring-2 ring-primary scale-110" 
                  : "opacity-60 hover:opacity-100"
              )}
            >
              <img
                src={photo}
                alt={`Miniatura ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
});

FullScreenViewer.displayName = "FullScreenViewer";

const PhotoGalleryGrid = memo(({
  photos,
  name,
  isOpen,
  onClose,
  initialIndex = 0,
  onSelectPhoto,
}: PhotoGalleryGridProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [viewerIndex, setViewerIndex] = useState(initialIndex);

  const handleThumbnailClick = useCallback((index: number) => {
    setSelectedIndex(index);
    setViewerIndex(index);
    if (navigator.vibrate) navigator.vibrate(10);
  }, []);

  const handleCloseViewer = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const handlePrev = useCallback(() => {
    setViewerIndex((prev) => (prev - 1 + photos.length) % photos.length);
    if (navigator.vibrate) navigator.vibrate(10);
  }, [photos.length]);

  const handleNext = useCallback(() => {
    setViewerIndex((prev) => (prev + 1) % photos.length);
    if (navigator.vibrate) navigator.vibrate(10);
  }, [photos.length]);

  const handleSelectAndClose = useCallback(() => {
    onSelectPhoto?.(viewerIndex);
    onClose();
    if (navigator.vibrate) navigator.vibrate(15);
  }, [viewerIndex, onSelectPhoto, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-background/98 backdrop-blur-sm overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-background/80 backdrop-blur-md border-b border-border/50">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-card hover:bg-card/80 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h2 className="font-display text-lg text-foreground">
                {name ? `Fotos de ${name}` : "Galería"}
              </h2>
              <p className="font-body text-xs text-muted-foreground">
                {photos.length} {photos.length === 1 ? "foto" : "fotos"}
              </p>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="p-4">
          <div 
            className={cn(
              "grid gap-3",
              photos.length === 1 && "grid-cols-1",
              photos.length === 2 && "grid-cols-2",
              photos.length >= 3 && "grid-cols-2 sm:grid-cols-3"
            )}
          >
            {photos.map((photo, index) => (
              <GridThumbnail
                key={photo}
                src={photo}
                alt={`${name || "Foto"} ${index + 1}`}
                index={index}
                isSelected={index === viewerIndex}
                onClick={() => handleThumbnailClick(index)}
              />
            ))}
          </div>
        </div>

        {/* Select button for carousel integration */}
        {onSelectPhoto && (
          <motion.div 
            className="sticky bottom-0 p-4 bg-gradient-to-t from-background via-background to-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={handleSelectAndClose}
              className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-body font-medium hover:bg-primary/90 transition-colors"
            >
              Ver foto {viewerIndex + 1}
            </button>
          </motion.div>
        )}

        {/* Full screen viewer */}
        <AnimatePresence>
          {selectedIndex !== null && (
            <FullScreenViewer
              photos={photos}
              currentIndex={viewerIndex}
              onClose={handleCloseViewer}
              onPrev={handlePrev}
              onNext={handleNext}
              name={name}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
});

PhotoGalleryGrid.displayName = "PhotoGalleryGrid";

export default PhotoGalleryGrid;