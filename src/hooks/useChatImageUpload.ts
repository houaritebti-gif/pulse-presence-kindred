import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { compressImage } from "@/utils/imageCompression";

export type ChatImageUploadPhase = "idle" | "compressing" | "uploading" | "complete";
export type ChatImageProgressCallback = (phase: ChatImageUploadPhase, progress: number) => void;

export const useChatImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<ChatImageUploadPhase>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadImage = async (
    file: File, 
    userId: string,
    onProgress?: ChatImageProgressCallback
  ): Promise<string | null> => {
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return null;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("La imagen es demasiado grande (máx. 5MB)");
      return null;
    }

    setIsUploading(true);
    setUploadPhase("compressing");
    setUploadProgress(0);

    try {
      // Compress the image with progress reporting
      const compressedFile = await compressImage(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.8,
        mimeType: "image/jpeg",
        onProgress: (progress) => {
          setUploadProgress(progress);
          onProgress?.("compressing", progress);
        },
      });

      // Start uploading
      setUploadPhase("uploading");
      setUploadProgress(0);
      onProgress?.("uploading", 0);

      const fileExt = "jpg";
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Simulate upload progress since Supabase doesn't provide native progress
      const estimatedUploadTime = Math.max(1000, compressedFile.size / 1000); // ~1KB/ms
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = Math.min(prev + 10, 90);
          onProgress?.("uploading", newProgress);
          return newProgress;
        });
      }, estimatedUploadTime / 10);

      const { error: uploadError } = await supabase.storage
        .from("chat-images")
        .upload(filePath, compressedFile);

      clearInterval(progressInterval);

      if (uploadError) throw uploadError;

      // Complete
      setUploadProgress(100);
      setUploadPhase("complete");
      onProgress?.("uploading", 100);
      onProgress?.("complete", 100);

      const { data } = supabase.storage
        .from("chat-images")
        .getPublicUrl(filePath);

      // Brief delay to show completion
      await new Promise(resolve => setTimeout(resolve, 300));

      return data.publicUrl;
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error("Error al subir la imagen");
      return null;
    } finally {
      setIsUploading(false);
      setUploadPhase("idle");
      setUploadProgress(0);
    }
  };

  return { 
    uploadImage, 
    isUploading, 
    uploadPhase, 
    uploadProgress 
  };
};
