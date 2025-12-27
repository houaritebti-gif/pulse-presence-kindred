import { useState, useRef } from "react";
import { Plus, X, GripVertical, Image as ImageIcon } from "lucide-react";
import { useProfilePhotos, useUploadProfilePhoto, useDeleteProfilePhoto } from "@/hooks/useProfilePhotos";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProfilePhotoManagerProps {
  profileId: string;
}

const MAX_PHOTOS = 6;

const ProfilePhotoManager = ({ profileId }: ProfilePhotoManagerProps) => {
  const { data: photos, isLoading } = useProfilePhotos(profileId);
  const uploadPhoto = useUploadProfilePhoto();
  const deletePhoto = useDeleteProfilePhoto();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

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

    setUploadingIndex(photoCount);
    
    try {
      await uploadPhoto.mutateAsync({
        profileId,
        file,
        displayOrder: photoCount,
      });
    } finally {
      setUploadingIndex(null);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-foreground">
          Tus fotos ({photoCount}/{MAX_PHOTOS})
        </h3>
        <p className="text-xs font-body text-muted-foreground">
          Arrastra para reordenar
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="grid grid-cols-3 gap-2">
        {/* Existing photos */}
        {photos?.map((photo, index) => (
          <div
            key={photo.id}
            className="relative aspect-[3/4] rounded-xl overflow-hidden group"
          >
            <img
              src={photo.photo_url}
              alt={`Foto ${index + 1}`}
              className="w-full h-full object-cover"
            />
            
            {/* Delete button */}
            <button
              onClick={() => handleDelete(photo.id, photo.photo_url)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              disabled={deletePhoto.isPending}
            >
              <X className="w-3 h-3 text-destructive-foreground" />
            </button>

            {/* Drag handle */}
            <div className="absolute bottom-1 left-1 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
              <GripVertical className="w-3 h-3 text-foreground" />
            </div>

            {/* Order badge */}
            {index === 0 && (
              <div className="absolute top-1 left-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                Principal
              </div>
            )}
          </div>
        ))}

        {/* Uploading placeholder */}
        {uploadingIndex !== null && (
          <div className="aspect-[3/4] rounded-xl bg-card-foreground/10 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty slots */}
        {uploadingIndex === null && [...Array(Math.min(emptySlots, 3 - (photoCount % 3 || 3)))].map((_, i) => (
          <button
            key={`empty-${i}`}
            onClick={handleAddClick}
            className={cn(
              "aspect-[3/4] rounded-xl border-2 border-dashed border-card-foreground/20 flex flex-col items-center justify-center gap-2 transition-colors",
              "hover:border-primary hover:bg-primary/5",
              photoCount === 0 && i === 0 && "border-primary bg-primary/5"
            )}
          >
            <div className="w-10 h-10 rounded-full bg-card-foreground/10 flex items-center justify-center">
              {photoCount === 0 && i === 0 ? (
                <ImageIcon className="w-5 h-5 text-primary" />
              ) : (
                <Plus className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <span className="text-xs font-body text-muted-foreground">
              {photoCount === 0 && i === 0 ? "Añade fotos" : "Añadir"}
            </span>
          </button>
        ))}

        {/* Show more add button if there's space */}
        {uploadingIndex === null && emptySlots > 0 && photoCount > 0 && (photoCount % 3 === 0) && (
          <button
            onClick={handleAddClick}
            className="aspect-[3/4] rounded-xl border-2 border-dashed border-card-foreground/20 flex flex-col items-center justify-center gap-2 transition-colors hover:border-primary hover:bg-primary/5"
          >
            <Plus className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs font-body text-muted-foreground">Añadir</span>
          </button>
        )}
      </div>

      <p className="text-xs font-body text-muted-foreground text-center">
        La primera foto será tu foto principal. Máximo 5MB por imagen.
      </p>
    </div>
  );
};

export default ProfilePhotoManager;
