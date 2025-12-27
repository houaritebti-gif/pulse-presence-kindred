import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateProfile } from "./useProfile";
import { compressAvatar, CompressionProgressCallback } from "@/utils/imageCompression";

export type AvatarUploadPhase = "compressing" | "uploading" | "complete";
export type AvatarProgressCallback = (phase: AvatarUploadPhase, progress: number) => void;

export const useAvatarUpload = () => {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<AvatarUploadPhase>("compressing");
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadAvatar = async (file: File, onProgress?: AvatarProgressCallback) => {
    if (!user) throw new Error("Not authenticated");

    setIsUploading(true);
    setUploadPhase("compressing");
    setUploadProgress(0);

    const updateProgress = (phase: AvatarUploadPhase, progress: number) => {
      setUploadPhase(phase);
      setUploadProgress(progress);
      onProgress?.(phase, progress);
    };

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
      const compressedFile = await compressAvatar(file, (compressionProgress) => {
        updateProgress("compressing", compressionProgress);
      });

      // Start upload phase
      updateProgress("uploading", 0);

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

      updateProgress("uploading", 50);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Add cache buster to force refresh
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

      // Update profile with new avatar URL
      await updateProfile.mutateAsync({ avatar_url: urlWithCacheBuster });

      updateProgress("uploading", 100);
      
      // Show complete state briefly
      updateProgress("complete", 100);
      await new Promise(resolve => setTimeout(resolve, 500));

      return urlWithCacheBuster;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadAvatar, isUploading, uploadPhase, uploadProgress };
};
