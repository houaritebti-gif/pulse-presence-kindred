import { useState } from "react";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import { cn } from "@/lib/utils";
import ImageLightbox from "@/components/ImageLightbox";

interface ProfilePhotoGalleryProps {
  photos: string[];
  avatarUrl?: string | null;
  name?: string | null;
}

const ProfilePhotoGallery = ({ photos, avatarUrl, name }: ProfilePhotoGalleryProps) => {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Combine photos with avatar as fallback
  const allPhotos = photos.length > 0 ? photos : avatarUrl ? [avatarUrl] : [];

  if (allPhotos.length === 0) {
    return null;
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? allPhotos.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === allPhotos.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
  };

  const handleMainImageClick = () => {
    setLightboxImage(allPhotos[currentIndex]);
  };

  return (
    <>
      <div className="space-y-3">
        {/* Main image display */}
        <div 
          className="relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer group"
          onClick={handleMainImageClick}
        >
          <img
            src={allPhotos[currentIndex]}
            alt={`${name || "Foto"} ${currentIndex + 1}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Images className="w-5 h-5 text-foreground" />
            </div>
          </div>

          {/* Navigation arrows (only if multiple photos) */}
          {allPhotos.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>
            </>
          )}

          {/* Photo counter */}
          {allPhotos.length > 1 && (
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-sm text-xs font-body text-foreground">
              {currentIndex + 1} / {allPhotos.length}
            </div>
          )}

          {/* Dots indicator */}
          {allPhotos.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {allPhotos.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleThumbnailClick(index);
                  }}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    index === currentIndex
                      ? "bg-primary w-4"
                      : "bg-background/60 hover:bg-background/80"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Thumbnail row (only if multiple photos) */}
        {allPhotos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {allPhotos.map((photo, index) => (
              <button
                key={index}
                onClick={() => handleThumbnailClick(index)}
                className={cn(
                  "flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden transition-all",
                  index === currentIndex
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
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
        )}
      </div>

      {/* Lightbox */}
      <ImageLightbox 
        imageUrl={lightboxImage} 
        onClose={() => setLightboxImage(null)} 
      />
    </>
  );
};

export default ProfilePhotoGallery;
