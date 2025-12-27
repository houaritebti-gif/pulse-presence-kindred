import { useState, useRef } from "react";
import { Plus, X, GripVertical, Image as ImageIcon, Camera, Sparkles, Crop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfilePhotos, useUploadProfilePhoto, useDeleteProfilePhoto, useReorderProfilePhotos, ProfilePhoto } from "@/hooks/useProfilePhotos";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import UploadProgress, { UploadPhase } from "./UploadProgress";
import ImageCropModal from "./ImageCropModal";

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
  
  // Drag state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Crop state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const photoCount = photos?.length || 0;
  const emptySlots = MAX_PHOTOS - photoCount;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    // Reset input for future selections
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
      toast.success("Foto añadida correctamente");
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

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Add a slight delay to show the drag visual
    const target = e.target as HTMLElement;
    setTimeout(() => {
      target.style.opacity = "0.5";
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = "1";
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
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
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex || !photos) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder the photos array
    const newPhotos = [...photos];
    const [draggedPhoto] = newPhotos.splice(draggedIndex, 1);
    newPhotos.splice(dropIndex, 0, draggedPhoto);

    // Get the new order of IDs
    const newPhotoIds = newPhotos.map(p => p.id);

    setDraggedIndex(null);
    setDragOverIndex(null);

    // Update in database
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
    <div className="space-y-4">
      {/* Header with prominent title */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-4 border border-primary/20">
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
                {photoCount}/{MAX_PHOTOS} fotos • Arrastra para reordenar
              </p>
            </div>
          </div>
          
          {/* Prominent add button */}
          {emptySlots > 0 && (
            <Button
              onClick={handleAddClick}
              size="sm"
              className="gap-2 shadow-lg shadow-primary/25"
            >
              <Plus className="w-4 h-4" />
              Añadir
            </Button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Photo grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Existing photos */}
        {photos?.map((photo, index) => (
          <div
            key={photo.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            className={cn(
              "relative aspect-[3/4] rounded-xl overflow-hidden group cursor-grab active:cursor-grabbing transition-all shadow-md",
              draggedIndex === index && "opacity-50 scale-95",
              dragOverIndex === index && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
            )}
          >
            <img
              src={photo.photo_url}
              alt={`Foto ${index + 1}`}
              className="w-full h-full object-cover pointer-events-none"
            />
            
            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(photo.id, photo.photo_url);
              }}
              className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-destructive/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg"
              disabled={deletePhoto.isPending}
            >
              <X className="w-3.5 h-3.5 text-destructive-foreground" />
            </button>

            {/* Drag handle indicator */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-1 rounded-full bg-background/90 backdrop-blur-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
              <GripVertical className="w-3 h-3 text-foreground" />
              <span className="text-[10px] font-body font-medium text-foreground">Arrastra</span>
            </div>

            {/* Order badge */}
            {index === 0 && (
              <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shadow-md">
                Principal
              </div>
            )}
          </div>
        ))}

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

        {/* Empty slots - show as clickable cards */}
        {uploadingIndex === null && [...Array(Math.min(emptySlots, photoCount === 0 ? 3 : Math.max(1, 3 - (photoCount % 3))))].map((_, i) => (
          <button
            key={`empty-${i}`}
            onClick={handleAddClick}
            className={cn(
              "aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all duration-200",
              "hover:border-primary hover:bg-primary/10 hover:scale-[1.02] active:scale-[0.98]",
              photoCount === 0 && i === 0 
                ? "border-primary bg-primary/10" 
                : "border-muted-foreground/30 bg-muted/30"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
              photoCount === 0 && i === 0 
                ? "bg-primary/20" 
                : "bg-muted-foreground/10"
            )}>
              {photoCount === 0 && i === 0 ? (
                <Camera className="w-6 h-6 text-primary" />
              ) : (
                <Plus className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <span className={cn(
              "text-sm font-body font-medium",
              photoCount === 0 && i === 0 ? "text-primary" : "text-muted-foreground"
            )}>
              {photoCount === 0 && i === 0 ? "Añade tu primera foto" : "Añadir foto"}
            </span>
          </button>
        ))}
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-center gap-2 text-xs font-body text-muted-foreground bg-muted/30 rounded-lg py-2 px-3">
        <Crop className="w-3.5 h-3.5" />
        <span>Recorta tus fotos antes de subir • Máx. 5MB</span>
      </div>

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
  );
};

export default ProfilePhotoManager;
