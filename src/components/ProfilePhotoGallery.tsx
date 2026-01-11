import { useState } from "react";
import { ChevronLeft, ChevronRight, Images, Camera, Plus } from "lucide-react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";
import ImageLightbox from "@/components/ImageLightbox";
import SharedPhotoTransition from "@/components/SharedPhotoTransition";
import { useNavigate } from "react-router-dom";

interface ProfilePhotoGalleryProps {
  photos: string[];
  avatarUrl?: string | null;
  name?: string | null;
  profileId?: string;
  isOwnProfile?: boolean;
}

const ProfilePhotoGallery = ({ photos, avatarUrl, name, profileId, isOwnProfile = false }: ProfilePhotoGalleryProps) => {
  const navigate = useNavigate();
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // Combine photos with avatar as fallback
  const allPhotos = photos.length > 0 ? photos : avatarUrl ? [avatarUrl] : [];

  // Show placeholder with initial if no photos
  if (allPhotos.length === 0) {
    // If it's own profile, show CTA to add photos
    if (isOwnProfile) {
      return (
        <SharedPhotoTransition profileId={profileId || ""} enabled={!!profileId}>
          <motion.button
            onClick={() => navigate('/profile')}
            className="w-full aspect-[4/5] rounded-2xl overflow-hidden relative flex flex-col items-center justify-center ring-2 ring-primary/30 animate-glow group transition-all hover:ring-primary/50"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
          <div 
            className="absolute inset-0 bg-gradient-to-br from-accent/30 via-primary/20 to-accent/30 bg-[length:200%_200%] animate-gradient-shift"
          />
          
          {/* Preview thumbnails showing how it could look */}
          <motion.div 
            className="absolute top-4 left-4 right-4 flex gap-2 justify-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-12 h-14 rounded-lg bg-card-foreground/10 border border-card-foreground/20 overflow-hidden"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.7, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.8 + i * 0.1 }}
              >
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Images className="w-4 h-4 text-card-foreground/30" />
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            className="relative z-10 flex flex-col items-center gap-4 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          >
            <motion.div 
              className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                duration: 0.5, 
                delay: 0.3, 
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
            >
              <motion.div
                animate={{ 
                  y: [0, -4, 0],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Camera className="w-10 h-10 text-primary" />
              </motion.div>
            </motion.div>
            <motion.div 
              className="text-center px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <p className="font-display font-semibold text-lg text-card-foreground">
                Añade tus fotos
              </p>
              <p className="font-body text-sm text-card-foreground/60 mt-1">
                Muestra tu mejor versión
              </p>
            </motion.div>
            <motion.div 
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/20 group-hover:bg-primary/30 transition-colors"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.4, 
                delay: 0.6,
                type: "spring",
                stiffness: 300,
                damping: 20
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-4 h-4 text-primary" />
              <span className="font-body text-sm font-medium text-primary">
                Subir fotos
              </span>
            </motion.div>
          </motion.div>

          {/* Bottom hint showing gallery preview */}
          <motion.div
            className="absolute bottom-4 left-4 right-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 1 }}
          >
            <div className="flex items-center justify-center gap-1.5">
              <div className="flex -space-x-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-card-foreground/30"
                  />
                ))}
              </div>
              <span className="font-body text-xs text-card-foreground/40">
                Sube hasta 5 fotos
              </span>
            </div>
          </motion.div>
        </motion.button>
        </SharedPhotoTransition>
      );
    }
    
    // Regular placeholder for other users
    return (
      <SharedPhotoTransition profileId={profileId || ""} enabled={!!profileId}>
        <div className="aspect-[4/5] rounded-2xl overflow-hidden relative flex items-center justify-center ring-2 ring-primary/30 animate-glow">
          <div 
            className="absolute inset-0 bg-gradient-to-br from-accent/30 via-primary/20 to-accent/30 bg-[length:200%_200%] animate-gradient-shift"
          />
          <span className="text-card-foreground/70 font-display font-semibold text-6xl relative z-10 drop-shadow-sm">
            {(name?.[0] || "?").toUpperCase()}
          </span>
        </div>
      </SharedPhotoTransition>
    );
  }

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? allPhotos.length - 1 : prev - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDirection(1);
    setCurrentIndex((prev) => (prev === allPhotos.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const handleMainImageClick = () => {
    setLightboxImage(allPhotos[currentIndex]);
  };

  // Swipe handler
  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipe = swipePower(info.offset.x, info.velocity.x);

    if (swipe < -swipeConfidenceThreshold) {
      handleNext();
    } else if (swipe > swipeConfidenceThreshold) {
      handlePrev();
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.95,
      filter: "blur(4px)",
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 100 : -100,
      opacity: 0,
      scale: 0.95,
      filter: "blur(4px)",
    }),
  };

  return (
    <>
      <SharedPhotoTransition profileId={profileId || ""} enabled={!!profileId}>
        <div className="space-y-3">
          {/* Main image display with swipe */}
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer group">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.img
              key={currentIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 400, damping: 35 },
                opacity: { duration: 0.25 },
                scale: { type: "spring", stiffness: 400, damping: 35 },
                filter: { duration: 0.2 },
              }}
              drag={allPhotos.length > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={handleDragEnd}
              onClick={handleMainImageClick}
              src={allPhotos[currentIndex]}
              alt={`${name || "Foto"} ${currentIndex + 1}`}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ touchAction: "pan-y" }}
            />
          </AnimatePresence>

          {/* Hover overlay - only show on non-touch devices */}
          <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Images className="w-5 h-5 text-foreground" />
            </div>
          </div>

          {/* Swipe hint for mobile */}
          {allPhotos.length > 1 && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-background/60 backdrop-blur-sm text-xs font-body text-foreground/70 md:hidden animate-pulse-soft pointer-events-none">
              ← Desliza →
            </div>
          )}

          {/* Navigation arrows (only if multiple photos) */}
          {allPhotos.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
              >
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>
            </>
          )}

          {/* Photo counter */}
          {allPhotos.length > 1 && (
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-sm text-xs font-body text-foreground z-10">
              {currentIndex + 1} / {allPhotos.length}
            </div>
          )}

          {/* Dots indicator */}
          {allPhotos.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {allPhotos.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleThumbnailClick(index);
                  }}
                  className="h-2 rounded-full bg-background/60"
                  animate={{
                    width: index === currentIndex ? 16 : 8,
                    backgroundColor: index === currentIndex 
                      ? "hsl(var(--primary))" 
                      : "hsl(var(--background) / 0.6)",
                    scale: index === currentIndex ? 1 : 0.9,
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Thumbnails removed - dots are enough for navigation */}
        </div>
      </SharedPhotoTransition>

      {/* Lightbox */}
      <ImageLightbox 
        imageUrl={lightboxImage} 
        onClose={() => setLightboxImage(null)} 
      />
    </>
  );
};

export default ProfilePhotoGallery;
