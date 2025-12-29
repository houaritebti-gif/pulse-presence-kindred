import { useState, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ChevronLeft, ChevronRight, Share2, Download, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PhotoGalleryGridProps {
  photos: string[];
  name?: string | null;
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
  onSelectPhoto?: (index: number) => void;
}

// Share photo utility
const sharePhoto = async (photoUrl: string, name?: string | null): Promise<boolean> => {
  try {
    // Try Web Share API first
    if (navigator.share) {
      // For blob URLs or data URLs, we need to fetch and create a file
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const file = new File([blob], `${name || "foto"}.jpg`, { type: blob.type || "image/jpeg" });
      
      await navigator.share({
        title: name ? `Foto de ${name}` : "Foto",
        files: [file],
      });
      return true;
    }
    
    // Fallback: copy URL to clipboard
    await navigator.clipboard.writeText(photoUrl);
    toast.success("Enlace copiado al portapapeles");
    return true;
  } catch (error) {
    // User cancelled or error
    if ((error as Error).name !== "AbortError") {
      console.error("Error sharing photo:", error);
      // Try clipboard as last resort
      try {
        await navigator.clipboard.writeText(photoUrl);
        toast.success("Enlace copiado al portapapeles");
        return true;
      } catch {
        toast.error("No se pudo compartir la foto");
      }
    }
    return false;
  }
};

// Download photo utility
const downloadPhoto = async (photoUrl: string, name?: string | null, index?: number) => {
  try {
    const response = await fetch(photoUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name || "foto"}_${(index ?? 0) + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Foto descargada");
  } catch (error) {
    console.error("Error downloading photo:", error);
    toast.error("No se pudo descargar la foto");
  }
};

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
      <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors flex items-center justify-center gap-2">
        <ZoomIn className="w-6 h-6 text-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      {/* Photo number */}
      <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center">
        <span className="text-xs font-body text-foreground">{index + 1}</span>
      </div>

      {/* Quick share button on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (navigator.vibrate) navigator.vibrate(10);
          sharePhoto(src, alt);
        }}
        className="absolute top-1 right-1 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-primary-foreground"
        title="Compartir"
      >
        <Share2 className="w-4 h-4" />
      </button>
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
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleShare = useCallback(async () => {
    setIsSharing(true);
    if (navigator.vibrate) navigator.vibrate(10);
    await sharePhoto(photos[currentIndex], name);
    setIsSharing(false);
  }, [photos, currentIndex, name]);

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    if (navigator.vibrate) navigator.vibrate(10);
    await downloadPhoto(photos[currentIndex], name, currentIndex);
    setIsDownloading(false);
  }, [photos, currentIndex, name]);

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
        <div className="flex items-center gap-2">
          {/* Share button */}
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="w-10 h-10 rounded-full bg-card hover:bg-card/80 flex items-center justify-center transition-colors disabled:opacity-50"
            title="Compartir"
          >
            {isSharing ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Share2 className="w-5 h-5 text-foreground" />
              </motion.div>
            ) : (
              <Share2 className="w-5 h-5 text-foreground" />
            )}
          </button>
          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-10 h-10 rounded-full bg-card hover:bg-card/80 flex items-center justify-center transition-colors disabled:opacity-50"
            title="Descargar"
          >
            {isDownloading ? (
              <Check className="w-5 h-5 text-primary" />
            ) : (
              <Download className="w-5 h-5 text-foreground" />
            )}
          </button>
          {/* Close button */}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-card hover:bg-card/80 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>
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