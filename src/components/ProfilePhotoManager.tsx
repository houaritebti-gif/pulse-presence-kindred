import { useState, useRef, useCallback } from "react";
import { Plus, X, GripVertical, Camera, Sparkles, Crop, ArrowUp, ArrowDown, AlertCircle, Info, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfilePhotos, useUploadProfilePhoto, useDeleteProfilePhoto, useReorderProfilePhotos } from "@/hooks/useProfilePhotos";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import UploadProgress, { UploadPhase } from "./UploadProgress";
import ImageCropModal from "./ImageCropModal";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { PhotoSourceSelector } from "./PhotoSourceSelector";
import { fireGalleryCompleteConfetti } from "@/utils/sparkConfetti";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProfilePhotoManagerProps {
  profileId: string;
}

const MAX_PHOTOS = 6;

const ProfilePhotoManager = ({ profileId }: ProfilePhotoManagerProps) => {
  const { data: photos, isLoading } = useProfilePhotos(profileId);
  const uploadPhoto = useUploadProfilePhoto();
  const deletePhoto = useDeleteProfilePhoto();
  const reorderPhotos = useReorderProfilePhotos();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("compressing");
  const [uploadProgress, setUploadProgress] = useState(0);
  const isMobile = useIsMobile();
  
  // Drag state (desktop only)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Crop state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  
  // Photo source selector state
  const [photoSourceOpen, setPhotoSourceOpen] = useState(false);
  
  // Shake animation state for max photos reached
  const [isShaking, setIsShaking] = useState(false);

  const photoCount = photos?.length || 0;
  const emptySlots = MAX_PHOTOS - photoCount;

  const handleFileSelect = useCallback(async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar 5MB");
      return;
    }

    // Store file and open crop modal
    setPendingFile(file);
    const imageUrl = URL.createObjectURL(file);
    setImageToCrop(imageUrl);
    setCropModalOpen(true);
  }, []);

  // Haptic feedback utility
  const triggerHapticFeedback = (pattern: number | number[] = 50) => {
    if (isMobile && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    // Clean up object URL
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop);
    }
    setImageToCrop(null);
    setPendingFile(null);

    // Create file from blob
    const croppedFile = new File([croppedBlob], "cropped-photo.jpg", {
      type: "image/jpeg",
    });

    setUploadingIndex(photoCount);
    setUploadPhase("compressing");
    setUploadProgress(0);
    
    try {
      await uploadPhoto.mutateAsync({
        profileId,
        file: croppedFile,
        displayOrder: photoCount,
        onProgress: (phase, progress) => {
          setUploadPhase(phase);
          setUploadProgress(progress);
        },
      });
      
      // Show complete state briefly
      setUploadPhase("complete");
      setUploadProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Haptic feedback on successful upload
      triggerHapticFeedback([50, 30, 50]);
      
      // Check if gallery is now complete (photoCount was before upload, so +1)
      const newPhotoCount = photoCount + 1;
      if (newPhotoCount >= MAX_PHOTOS) {
        fireGalleryCompleteConfetti();
        toast.success("🎉 ¡Galería completada! Tu perfil está listo", {
          duration: 4000,
        });
      } else {
        toast.success("Foto añadida correctamente");
      }
    } finally {
      setUploadingIndex(null);
      setUploadProgress(0);
    }
  };

  const handleCropClose = () => {
    // Clean up object URL
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop);
    }
    setImageToCrop(null);
    setPendingFile(null);
    setCropModalOpen(false);
  };

  const handleDelete = async (photoId: string, photoUrl: string) => {
    await deletePhoto.mutateAsync({
      photoId,
      profileId,
      photoUrl,
    });
  };

  const handleAddClick = useCallback(() => {
    // Check if max photos reached
    if (emptySlots <= 0) {
      setIsShaking(true);
      triggerHapticFeedback([100, 50, 100]);
      toast.error(`Máximo ${MAX_PHOTOS} fotos permitidas`, {
        icon: <AlertCircle className="w-4 h-4" />,
      });
      setTimeout(() => setIsShaking(false), 500);
      return;
    }
    
    if (isMobile) {
      setPhotoSourceOpen(true);
    } else {
      fileInputRef.current?.click();
    }
  }, [isMobile, emptySlots, triggerHapticFeedback]);
  
  // Handle file input change for desktop
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input for future selections
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [handleFileSelect]);

  // Mobile reorder - move photo up or down
  const handleMovePhoto = useCallback(async (index: number, direction: 'up' | 'down') => {
    if (!photos) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= photos.length) return;

    // Haptic feedback when starting reorder
    if (isMobile && navigator.vibrate) {
      navigator.vibrate(30);
    }

    const newPhotos = [...photos];
    const [movedPhoto] = newPhotos.splice(index, 1);
    newPhotos.splice(newIndex, 0, movedPhoto);

    const newPhotoIds = newPhotos.map(p => p.id);

    await reorderPhotos.mutateAsync({
      profileId,
      photoIds: newPhotoIds,
    });

    // Haptic feedback on successful reorder
    if (isMobile && navigator.vibrate) {
      navigator.vibrate([20, 10, 20]);
    }

    toast.success(direction === 'up' ? "Foto movida arriba" : "Foto movida abajo");
  }, [photos, profileId, reorderPhotos, isMobile]);

  // Set photo as main (move to first position)
  const handleSetAsMain = useCallback(async (index: number) => {
    if (!photos || index === 0) return;

    triggerHapticFeedback([50, 30, 50]);

    const newPhotos = [...photos];
    const [movedPhoto] = newPhotos.splice(index, 1);
    newPhotos.unshift(movedPhoto);

    const newPhotoIds = newPhotos.map(p => p.id);

    await reorderPhotos.mutateAsync({
      profileId,
      photoIds: newPhotoIds,
    });

    toast.success("📸 Foto establecida como principal");
  }, [photos, profileId, reorderPhotos, triggerHapticFeedback]);

  // Drag handlers (desktop only)
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (isMobile) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    const target = e.target as HTMLElement;
    setTimeout(() => {
      target.style.opacity = "0.5";
    }, 0);
  };

  const handleDragEnd = (e?: React.DragEvent) => {
    if (e) {
      const target = e.target as HTMLElement;
      target.style.opacity = "1";
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (isMobile) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    if (isMobile) return;
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex || !photos) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newPhotos = [...photos];
    const [draggedPhoto] = newPhotos.splice(draggedIndex, 1);
    newPhotos.splice(dropIndex, 0, draggedPhoto);

    const newPhotoIds = newPhotos.map(p => p.id);

    setDraggedIndex(null);
    setDragOverIndex(null);

    await reorderPhotos.mutateAsync({
      profileId,
      photoIds: newPhotoIds,
    });

    toast.success("Orden actualizado");
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="aspect-[3/4] rounded-xl bg-card-foreground/10 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
    <div className={cn("space-y-4", isShaking && "animate-shake")}>
      {/* Header with prominent title */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-4 border border-primary/20"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Camera className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                Galería de fotos
                <Sparkles className="w-4 h-4 text-primary" />
              </h3>
              <p className="text-xs font-body text-muted-foreground">
                {isMobile ? "Usa las flechas para reordenar" : "Arrastra para reordenar"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Animated photo counter */}
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1">
                {[...Array(MAX_PHOTOS)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: 1, 
                      opacity: 1,
                    }}
                    transition={{ 
                      delay: i * 0.05,
                      type: "spring",
                      stiffness: 400,
                      damping: 20
                    }}
                    className={cn(
                      "w-3 h-3 rounded-full border-2 border-background transition-colors duration-300",
                      i < photoCount 
                        ? "bg-primary" 
                        : "bg-muted-foreground/20"
                    )}
                  />
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.span
                  key={emptySlots}
                  initial={{ opacity: 0, y: -10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className={cn(
                    "text-xs font-bold tabular-nums min-w-[3ch] text-center",
                    emptySlots === 0 
                      ? "text-destructive" 
                      : emptySlots <= 2 
                        ? "text-amber-500" 
                        : "text-primary"
                  )}
                >
                  {emptySlots > 0 ? `+${emptySlots}` : "Lleno"}
                </motion.span>
              </AnimatePresence>
            </div>
            
            {/* Prominent add button - larger on mobile */}
            {emptySlots > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleAddClick}
                    size={isMobile ? "lg" : "sm"}
                    className={cn(
                      "gap-2 shadow-lg shadow-primary/25 font-semibold",
                      isMobile && "px-6 py-3 text-base animate-pulse-soft"
                    )}
                  >
                    <Plus className={cn("w-4 h-4", isMobile && "w-5 h-5")} />
                    {isMobile ? "Añadir foto" : "Añadir"}
                  </Button>
                </TooltipTrigger>
                {!isMobile && (
                  <TooltipContent side="bottom">
                    <p>Sube una nueva foto a tu galería</p>
                  </TooltipContent>
                )}
              </Tooltip>
            )}
          </div>
        </div>
      </motion.div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Photo grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Existing photos */}
        <AnimatePresence mode="popLayout">
          {photos?.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ 
                opacity: 0, 
                scale: 0.6, 
                y: 40,
                rotateX: 15,
              }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
                rotateX: 0,
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.8, 
                y: -20,
              }}
              transition={{ 
                duration: 0.5, 
                delay: index * 0.12,
                type: "spring",
                stiffness: 200,
                damping: 20,
                mass: 0.8,
              }}
              layout
              draggable={!isMobile}
              onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, index)}
              onDragEnd={() => handleDragEnd()}
              onDragOver={(e) => handleDragOver(e as unknown as React.DragEvent, index)}
              onDragLeave={() => handleDragLeave()}
              onDrop={(e) => handleDrop(e as unknown as React.DragEvent, index)}
              className={cn(
                "relative aspect-[3/4] rounded-xl overflow-hidden group transition-all shadow-md",
                !isMobile && "cursor-grab active:cursor-grabbing",
                draggedIndex === index && "opacity-50 scale-95",
                dragOverIndex === index && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
              )}
            >
              <img
                src={photo.photo_url}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover pointer-events-none"
              />
              
              {/* Delete button - always visible on mobile */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(photo.id, photo.photo_url);
                    }}
                    className={cn(
                      "absolute top-1.5 right-1.5 w-8 h-8 rounded-full bg-destructive/90 backdrop-blur-sm flex items-center justify-center z-10 shadow-lg transition-opacity",
                      isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                    disabled={deletePhoto.isPending}
                    aria-label="Eliminar foto"
                  >
                    <X className="w-4 h-4 text-destructive-foreground" />
                  </button>
                </TooltipTrigger>
                {!isMobile && (
                  <TooltipContent side="left">
                    <p>Eliminar esta foto</p>
                  </TooltipContent>
                )}
              </Tooltip>

              {/* Mobile reorder buttons */}
              {isMobile && photos && photos.length > 1 && (
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMovePhoto(index, 'up');
                    }}
                    disabled={index === 0 || reorderPhotos.isPending}
                    className={cn(
                      "w-8 h-8 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-md transition-all active:scale-95",
                      index === 0 && "opacity-40"
                    )}
                  >
                    <ArrowUp className="w-4 h-4 text-foreground" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMovePhoto(index, 'down');
                    }}
                    disabled={index === photos.length - 1 || reorderPhotos.isPending}
                    className={cn(
                      "w-8 h-8 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-md transition-all active:scale-95",
                      index === photos.length - 1 && "opacity-40"
                    )}
                  >
                    <ArrowDown className="w-4 h-4 text-foreground" />
                  </button>
                </div>
              )}

              {/* Desktop drag handle indicator */}
              {!isMobile && (
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-1 rounded-full bg-background/90 backdrop-blur-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                  <GripVertical className="w-3 h-3 text-foreground" />
                  <span className="text-[10px] font-body font-medium text-foreground">Arrastra</span>
                </div>
              )}

              {/* Order number badge - subtle position indicator */}
              <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                {index + 1}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Uploading placeholder with progress */}
        {uploadingIndex !== null && (
          <div className="aspect-[3/4] rounded-xl bg-card border-2 border-dashed border-primary/30 flex items-center justify-center overflow-hidden">
            <UploadProgress
              isVisible={true}
              phase={uploadPhase}
              progress={uploadProgress}
            />
          </div>
        )}

        {/* Empty slots - show as clickable cards, more prominent on mobile */}
        {uploadingIndex === null && [...Array(Math.min(emptySlots, photoCount === 0 ? 3 : Math.max(1, 3 - (photoCount % 3))))].map((_, i) => (
          <motion.button
            key={`empty-${i}`}
            initial={{ 
              opacity: 0, 
              scale: 0.5, 
              y: 30,
            }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
            }}
            transition={{ 
              duration: 0.4, 
              delay: (photoCount + i) * 0.12 + 0.1,
              type: "spring",
              stiffness: 250,
              damping: 22,
            }}
            onClick={handleAddClick}
            className={cn(
              "aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all duration-200",
              "hover:border-primary hover:bg-primary/10 active:scale-[0.98]",
              isMobile && "active:bg-primary/20 border-[3px]",
              photoCount === 0 && i === 0 
                ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" 
                : "border-muted-foreground/30 bg-muted/30"
            )}
          >
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                delay: (photoCount + i) * 0.12 + 0.3,
                type: "spring",
                stiffness: 300,
                damping: 15,
              }}
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center transition-colors",
                isMobile && "w-20 h-20",
                photoCount === 0 && i === 0 
                  ? "bg-primary/30 animate-pulse-soft" 
                  : "bg-muted-foreground/10"
              )}
            >
              {photoCount === 0 && i === 0 ? (
                <Camera className={cn("w-7 h-7 text-primary", isMobile && "w-10 h-10")} />
              ) : (
                <Plus className={cn("w-7 h-7 text-muted-foreground", isMobile && "w-9 h-9")} />
              )}
            </motion.div>
            <span className={cn(
              "text-sm font-body font-semibold text-center px-2",
              isMobile && "text-base",
              photoCount === 0 && i === 0 ? "text-primary" : "text-muted-foreground"
            )}>
              {photoCount === 0 && i === 0 
                ? (isMobile ? "📸 Toca para añadir" : "Añade tu primera foto") 
                : (isMobile ? "➕ Añadir" : "Añadir foto")}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-center gap-2 text-xs font-body text-muted-foreground bg-muted/30 rounded-lg py-2 px-3">
        <Crop className="w-3.5 h-3.5" />
        <span>Recorta tus fotos antes de subir • Máx. 5MB</span>
      </div>

      {/* Photo Source Selector (mobile only) */}
      <PhotoSourceSelector
        open={photoSourceOpen}
        onOpenChange={setPhotoSourceOpen}
        onFileSelect={handleFileSelect}
        title="Añadir foto"
      />

      {/* Crop Modal */}
      {imageToCrop && (
        <ImageCropModal
          isOpen={cropModalOpen}
          onClose={handleCropClose}
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
          aspectRatio={3 / 4}
        />
      )}
    </div>
    </TooltipProvider>
  );
};

export default ProfilePhotoManager;
