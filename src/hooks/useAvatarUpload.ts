import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateProfile } from "./useProfile";
import { compressAvatar, CompressionProgressCallback } from "@/utils/imageCompression";
import { validateImageQuality } from "@/utils/imageBlurDetection";

export type AvatarUploadPhase = "compressing" | "uploading" | "complete" | "error";
export type AvatarProgressCallback = (phase: AvatarUploadPhase, progress: number) => void;

// Detect Safari for extended timeouts
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// Extended timeouts for Safari (known to be slower with file operations)
const UPLOAD_TIMEOUT_MS = isSafari ? 60000 : 30000;
const COMPRESSION_TIMEOUT_MS = isSafari ? 30000 : 15000;
const VALIDATION_TIMEOUT_MS = isSafari ? 15000 : 10000;
const PROFILE_UPDATE_TIMEOUT_MS = isSafari ? 30000 : 15000;

// Helper to create a timeout promise
const createTimeout = (ms: number, operation: string): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${operation} tardó demasiado. Por favor, intenta de nuevo.`));
    }, ms);
  });
};

export const useAvatarUpload = () => {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<AvatarUploadPhase>("compressing");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const resetState = useCallback(() => {
    setIsUploading(false);
    setUploadPhase("compressing");
    setUploadProgress(0);
    setErrorMessage(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const uploadAvatar = async (file: File, onProgress?: AvatarProgressCallback) => {
    if (!user) throw new Error("Not authenticated");

    // Reset any previous state
    resetState();
    
    setIsUploading(true);
    setUploadPhase("compressing");
    setUploadProgress(0);
    setErrorMessage(null);

    // Create new abort controller for this upload
    abortControllerRef.current = new AbortController();

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

      // Validate image quality (blur detection) - with timeout
      // Skip validation on Safari to avoid blocking issues
      if (!isSafari) {
        try {
          const qualityError = await Promise.race([
            validateImageQuality(file),
            createTimeout(VALIDATION_TIMEOUT_MS, "La validación de imagen")
          ]);
          if (qualityError) {
            throw new Error(qualityError);
          }
        } catch (qualityErr: any) {
          // Only throw if it's a blur error, not a timeout
          if (qualityErr.message.includes("borrosa")) {
            throw qualityErr;
          }
          // Continue anyway if validation times out
          console.warn("Image quality validation timed out, continuing...");
        }
      }

      updateProgress("compressing", 10);

      // Compress image before upload - with extended timeout for Safari
      let compressedFile: File;
      try {
        compressedFile = await Promise.race([
          compressAvatar(file, (compressionProgress) => {
            updateProgress("compressing", compressionProgress);
          }),
          createTimeout(COMPRESSION_TIMEOUT_MS, "La compresión de imagen")
        ]);
      } catch (compressionErr: any) {
        // If compression fails/times out on Safari, try using original file if small enough
        if (isSafari && file.size < 2 * 1024 * 1024) {
          console.warn("Compression failed on Safari, using original file");
          compressedFile = file;
        } else {
          throw compressionErr;
        }
      }

      // Start upload phase
      updateProgress("uploading", 0);

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.jpg`;

      // Upload compressed image to storage - with timeout
      const uploadPromise = supabase.storage
        .from("avatars")
        .upload(fileName, compressedFile, { 
          upsert: true,
          contentType: "image/jpeg",
        });

      const { error: uploadError } = await Promise.race([
        uploadPromise,
        createTimeout(UPLOAD_TIMEOUT_MS, "La subida de imagen")
      ]);

      if (uploadError) throw uploadError;

      updateProgress("uploading", 50);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Add cache buster to force refresh
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

      // Update profile with new avatar URL - with extended timeout for Safari
      await Promise.race([
        updateProfile.mutateAsync({ avatar_url: urlWithCacheBuster }),
        createTimeout(PROFILE_UPDATE_TIMEOUT_MS, "La actualización del perfil")
      ]);

      updateProgress("uploading", 100);
      
      // Show complete state briefly
      updateProgress("complete", 100);
      await new Promise(resolve => setTimeout(resolve, 500));

      return urlWithCacheBuster;
    } catch (error: any) {
      // Set error phase for UI feedback
      setUploadPhase("error");
      setErrorMessage(error.message || "Error al subir la foto");
      throw error;
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
    }
  };

  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    resetState();
  }, [resetState]);

  return { 
    uploadAvatar, 
    isUploading, 
    uploadPhase, 
    uploadProgress, 
    errorMessage,
    cancelUpload,
    resetState 
  };
};
