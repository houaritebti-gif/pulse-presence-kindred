// Image compression utility
// Compresses images before upload to optimize storage and load times

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  mimeType?: "image/jpeg" | "image/webp";
}

const defaultOptions: CompressionOptions = {
  maxWidth: 1200,
  maxHeight: 1600,
  quality: 0.85,
  mimeType: "image/jpeg",
};

/**
 * Compresses an image file using Canvas API
 * @param file - The original image file
 * @param options - Compression options
 * @returns Compressed file as Blob
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  const { maxWidth, maxHeight, quality, mimeType } = {
    ...defaultOptions,
    ...options,
  };

  return new Promise((resolve, reject) => {
    // Skip compression for non-image files
    if (!file.type.startsWith("image/")) {
      resolve(file);
      return;
    }

    // Skip compression for GIFs (to preserve animation)
    if (file.type === "image/gif") {
      resolve(file);
      return;
    }

    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;

      if (width > maxWidth! || height > maxHeight!) {
        const aspectRatio = width / height;

        if (width > height) {
          width = Math.min(width, maxWidth!);
          height = width / aspectRatio;
        } else {
          height = Math.min(height, maxHeight!);
          width = height * aspectRatio;
        }
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw image with high quality settings
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to compress image"));
            return;
          }

          // Create new file with compressed data
          const compressedFile = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, ".jpg"),
            {
              type: mimeType,
              lastModified: Date.now(),
            }
          );

          // Log compression results
          const originalSize = file.size;
          const compressedSize = compressedFile.size;
          const savings = ((1 - compressedSize / originalSize) * 100).toFixed(1);
          
          console.log(
            `Image compressed: ${formatBytes(originalSize)} → ${formatBytes(compressedSize)} (${savings}% smaller)`
          );

          resolve(compressedFile);
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    // Load image from file
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Compresses image for avatar (smaller, square-optimized)
 */
export const compressAvatar = (file: File): Promise<File> => {
  return compressImage(file, {
    maxWidth: 500,
    maxHeight: 500,
    quality: 0.85,
    mimeType: "image/jpeg",
  });
};

/**
 * Compresses image for profile gallery (larger, portrait-optimized)
 */
export const compressProfilePhoto = (file: File): Promise<File> => {
  return compressImage(file, {
    maxWidth: 1200,
    maxHeight: 1600,
    quality: 0.85,
    mimeType: "image/jpeg",
  });
};

/**
 * Compresses image for chat (medium size)
 */
export const compressChatImage = (file: File): Promise<File> => {
  return compressImage(file, {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.8,
    mimeType: "image/jpeg",
  });
};

// Helper to format bytes
const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Get estimated upload time based on file size
 */
export const getEstimatedUploadTime = (fileSize: number): string => {
  // Assume average upload speed of 1MB/s
  const seconds = fileSize / (1024 * 1024);
  if (seconds < 1) return "menos de 1 segundo";
  if (seconds < 60) return `${Math.ceil(seconds)} segundos`;
  return `${Math.ceil(seconds / 60)} minutos`;
};
