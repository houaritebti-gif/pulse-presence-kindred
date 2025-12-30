import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { compressProfilePhoto, CompressionProgressCallback } from "@/utils/imageCompression";

const MAX_PHOTOS = 6;

export type UploadProgressCallback = (phase: "compressing" | "uploading", progress: number) => void;

export interface ProfilePhoto {
  id: string;
  profile_id: string;
  photo_url: string;
  display_order: number;
  created_at: string;
}

// Fetch photos for a specific profile
export const useProfilePhotos = (profileId: string | undefined) => {
  return useQuery({
    queryKey: ["profile-photos", profileId],
    queryFn: async () => {
      if (!profileId) return [];
      
      const { data, error } = await supabase
        .from("profile_photos")
        .select("*")
        .eq("profile_id", profileId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as ProfilePhoto[];
    },
    enabled: !!profileId,
    staleTime: 1000 * 60 * 5, // 5 minutes - photos rarely change
  });
};

// Fetch photos for multiple profiles at once (optimized for presence list)
export const useMultipleProfilePhotos = (profileIds: string[]) => {
  return useQuery({
    queryKey: ["profile-photos-batch", profileIds.sort().join(",")],
    queryFn: async () => {
      if (profileIds.length === 0) return {};
      
      const { data, error } = await supabase
        .from("profile_photos")
        .select("*")
        .in("profile_id", profileIds)
        .order("display_order", { ascending: true });

      if (error) throw error;
      
      // Group by profile_id
      const grouped: Record<string, ProfilePhoto[]> = {};
      for (const photo of data as ProfilePhoto[]) {
        if (!grouped[photo.profile_id]) {
          grouped[photo.profile_id] = [];
        }
        grouped[photo.profile_id].push(photo);
      }
      
      return grouped;
    },
    enabled: profileIds.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes - photos rarely change
  });
};

// Upload a new photo with progress callback
export const useUploadProfilePhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      profileId, 
      file, 
      displayOrder,
      onProgress,
    }: { 
      profileId: string; 
      file: File; 
      displayOrder: number;
      onProgress?: UploadProgressCallback;
    }) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Check max photos limit
      const { count } = await supabase
        .from("profile_photos")
        .select("*", { count: "exact", head: true })
        .eq("profile_id", profileId);

      if (count !== null && count >= MAX_PHOTOS) {
        throw new Error(`Máximo ${MAX_PHOTOS} fotos permitidas`);
      }

      // Compress image before upload with progress reporting
      const compressedFile = await compressProfilePhoto(file, (compressionProgress) => {
        onProgress?.("compressing", compressionProgress);
      });

      // Start upload phase
      onProgress?.("uploading", 0);

      // Upload to storage
      const fileName = `${user.id}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(fileName, compressedFile, { 
          upsert: true,
          contentType: "image/jpeg",
        });

      if (uploadError) throw uploadError;

      // Report upload progress (storage API doesn't support progress, so we simulate it)
      onProgress?.("uploading", 50);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(fileName);

      // Insert into database
      const { data, error } = await supabase
        .from("profile_photos")
        .insert({
          profile_id: profileId,
          photo_url: urlData.publicUrl,
          display_order: displayOrder,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Complete
      onProgress?.("uploading", 100);
      
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["profile-photos", variables.profileId] });
      toast.success("Foto subida");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al subir la foto");
    },
  });
};

// Delete a photo
export const useDeleteProfilePhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      photoId, 
      profileId,
      photoUrl 
    }: { 
      photoId: string; 
      profileId: string;
      photoUrl: string;
    }) => {
      // Delete from database
      const { error } = await supabase
        .from("profile_photos")
        .delete()
        .eq("id", photoId);

      if (error) throw error;

      // Try to delete from storage (extract path from URL)
      try {
        const urlParts = photoUrl.split("/profile-photos/");
        if (urlParts[1]) {
          await supabase.storage
            .from("profile-photos")
            .remove([urlParts[1]]);
        }
      } catch (e) {
        console.warn("Could not delete file from storage:", e);
      }

      return { photoId, profileId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["profile-photos", data.profileId] });
      toast.success("Foto eliminada");
    },
    onError: () => {
      toast.error("Error al eliminar la foto");
    },
  });
};

// Reorder photos
export const useReorderProfilePhotos = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      profileId, 
      photoIds 
    }: { 
      profileId: string; 
      photoIds: string[];
    }) => {
      // Update each photo's display_order
      for (let i = 0; i < photoIds.length; i++) {
        const { error } = await supabase
          .from("profile_photos")
          .update({ display_order: i })
          .eq("id", photoIds[i]);

        if (error) throw error;
      }

      return { profileId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["profile-photos", data.profileId] });
    },
  });
};
