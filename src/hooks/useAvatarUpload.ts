import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateProfile } from "./useProfile";
import { compressAvatar } from "@/utils/imageCompression";

export const useAvatarUpload = () => {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const [isUploading, setIsUploading] = useState(false);

  const uploadAvatar = async (file: File) => {
    if (!user) throw new Error("Not authenticated");

    setIsUploading(true);

    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Solo se permiten imágenes");
      }

      // Validate file size (max 10MB before compression)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("La imagen no puede superar 10MB");
      }

      // Compress image before upload
      const compressedFile = await compressAvatar(file);

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.jpg`;

      // Upload compressed image to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, compressedFile, { 
          upsert: true,
          contentType: "image/jpeg",
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Add cache buster to force refresh
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

      // Update profile with new avatar URL
      await updateProfile.mutateAsync({ avatar_url: urlWithCacheBuster });

      return urlWithCacheBuster;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadAvatar, isUploading };
};
