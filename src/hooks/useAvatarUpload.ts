import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateProfile } from "./useProfile";
import { compressAvatar, compressAvatarFast, CompressionProgressCallback } from "@/utils/imageCompression";

export type AvatarUploadPhase = "compressing" | "uploading" | "complete" | "error";
export type AvatarProgressCallback = (phase: AvatarUploadPhase, progress: number) => void;

// Detect Safari/iOS for extended timeouts and special handling
const isSafariOrIOS = (): boolean => {
  const ua = navigator.userAgent;
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return isSafari || isIOS;
};

// Extended timeouts for Safari/iOS (known to be slower with file operations)
const getTimeouts = () => {
  const safari = isSafariOrIOS();
  return {
    upload: safari ? 90000 : 30000,        // 90s on Safari
    compression: safari ? 45000 : 15000,   // 45s on Safari
    validation: safari ? 20000 : 10000,    // 20s on Safari
    profileUpdate: safari ? 45000 : 15000, // 45s on Safari
  };
};

// Helper to create a timeout promise
const createTimeout = (ms: number, operation: string): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${operation} tardó demasiado. Por favor, intenta de nuevo.`));
    }, ms);
  });
};

// Retry helper with exponential backoff
const withRetry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (attempt < maxAttempts - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError!;
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

    const timeouts = getTimeouts();
    const safari = isSafariOrIOS();

    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Solo se permiten imágenes");
      }

      // Validate file size (max 10MB before compression)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("La imagen no puede superar 10MB");
      }

      // Skip blur validation on Safari/iOS completely - it causes hangs
      // On other browsers, validate but with timeout and graceful degradation
      if (!safari) {
        try {
          const { validateImageQuality } = await import("@/utils/imageBlurDetection");
          const qualityError = await Promise.race([
            validateImageQuality(file),
            createTimeout(timeouts.validation, "La validación de imagen")
          ]);
          if (qualityError) {
            throw new Error(qualityError);
          }
        } catch (qualityErr: any) {
          // Only throw if it's a blur error, not a timeout or import error
          if (qualityErr.message?.includes("borrosa")) {
            throw qualityErr;
          }
          // Continue anyway if validation times out or fails to load
          console.warn("Image quality validation skipped:", qualityErr.message);
        }
      }

      updateProgress("compressing", 10);

      // Compress image with retry and fallbacks
      let compressedFile: File;
      try {
        // Try normal compression first
        compressedFile = await Promise.race([
          withRetry(() => compressAvatar(file, (compressionProgress) => {
            updateProgress("compressing", compressionProgress);
          }), safari ? 2 : 3),
          createTimeout(timeouts.compression, "La compresión de imagen")
        ]);
      } catch (compressionErr: any) {
        console.warn("Standard compression failed, trying fast compression...");
        
        // Try fast compression as fallback
        try {
          compressedFile = await Promise.race([
            compressAvatarFast(file, (p) => updateProgress("compressing", p)),
            createTimeout(timeouts.compression / 2, "La compresión rápida")
          ]);
        } catch {
          // If all compression fails, use original if small enough
          if (file.size < 3 * 1024 * 1024) {
            console.warn("All compression failed, using original file");
            compressedFile = file;
          } else {
            throw new Error("No se pudo procesar la imagen. Intenta con una más pequeña.");
          }
        }
      }

      // Start upload phase
      updateProgress("uploading", 5);

      const fileName = `${user.id}/avatar.jpg`;

      // Simulate incremental progress during upload since Supabase doesn't provide native progress
      let uploadDone = false;
      const estimatedTime = Math.max(2000, compressedFile.size / 500); // estimate based on file size
      const progressInterval = setInterval(() => {
        if (!uploadDone) {
          setUploadProgress(prev => {
            const next = Math.min(prev + 5, 85);
            onProgress?.("uploading", next);
            return next;
          });
        }
      }, estimatedTime / 15);

      // Upload compressed image to storage - with retry for reliability
      const uploadPromise = async () => {
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, compressedFile, { 
            upsert: true,
            contentType: "image/jpeg",
          });
        if (uploadError) throw uploadError;
      };

      try {
        await Promise.race([
          withRetry(uploadPromise, safari ? 3 : 2, 2000),
          createTimeout(timeouts.upload, "La subida de imagen")
        ]);
      } finally {
        uploadDone = true;
        clearInterval(progressInterval);
      }

      updateProgress("uploading", 90);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Add cache buster to force refresh
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

      // Update profile with new avatar URL - with retry
      await Promise.race([
        withRetry(() => updateProfile.mutateAsync({ avatar_url: urlWithCacheBuster }), 2, 1000),
        createTimeout(timeouts.profileUpdate, "La actualización del perfil")
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
