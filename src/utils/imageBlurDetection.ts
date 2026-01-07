/**
 * Image Blur Detection using Laplacian Variance
 * 
 * This utility detects blurry images by calculating the variance of the Laplacian.
 * Lower variance = more blur (fewer edges detected)
 */

export interface BlurDetectionResult {
  isBlurry: boolean;
  sharpnessScore: number; // 0-100, higher = sharper
  variance: number;
}

// Threshold for considering an image blurry (lower variance = more blur)
// This value has been calibrated for typical profile photos
const BLUR_THRESHOLD = 100;

// Minimum acceptable sharpness score (0-100)
const MIN_SHARPNESS_SCORE = 25;

/**
 * Detect if an image is blurry using Laplacian variance method
 */
export const detectBlur = async (
  imageSource: File | HTMLImageElement | string
): Promise<BlurDetectionResult> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const result = analyzeImageSharpness(img);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image for blur detection"));
    };

    // Handle different input types
    if (imageSource instanceof File) {
      img.src = URL.createObjectURL(imageSource);
    } else if (imageSource instanceof HTMLImageElement) {
      // If already loaded, analyze directly
      if (imageSource.complete && imageSource.naturalWidth > 0) {
        try {
          const result = analyzeImageSharpness(imageSource);
          resolve(result);
        } catch (error) {
          reject(error);
        }
        return;
      }
      img.src = imageSource.src;
    } else {
      // String URL
      img.src = imageSource;
    }
  });
};

/**
 * Analyze image sharpness using Laplacian variance
 */
function analyzeImageSharpness(img: HTMLImageElement): BlurDetectionResult {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Resize for faster processing (max 300px on longest side)
  const maxSize = 300;
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  if (width > height) {
    if (width > maxSize) {
      height = Math.round((height * maxSize) / width);
      width = maxSize;
    }
  } else {
    if (height > maxSize) {
      width = Math.round((width * maxSize) / height);
      height = maxSize;
    }
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);

  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Convert to grayscale
  const grayscale = new Float32Array(width * height);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Standard grayscale conversion
    grayscale[i / 4] = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  // Apply Laplacian filter (3x3 kernel)
  // Laplacian kernel:
  // [0,  1, 0]
  // [1, -4, 1]
  // [0,  1, 0]
  const laplacian: number[] = [];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      
      const center = grayscale[idx];
      const top = grayscale[idx - width];
      const bottom = grayscale[idx + width];
      const left = grayscale[idx - 1];
      const right = grayscale[idx + 1];

      // Apply Laplacian kernel
      const value = top + bottom + left + right - 4 * center;
      laplacian.push(value);
    }
  }

  // Calculate variance of Laplacian
  const mean = laplacian.reduce((a, b) => a + b, 0) / laplacian.length;
  const variance = laplacian.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / laplacian.length;

  // Convert variance to a 0-100 sharpness score
  // Using a logarithmic scale for better distribution
  const rawScore = Math.log10(variance + 1) * 25;
  const sharpnessScore = Math.min(100, Math.max(0, rawScore));

  const isBlurry = variance < BLUR_THRESHOLD || sharpnessScore < MIN_SHARPNESS_SCORE;

  console.log(`Blur detection: variance=${variance.toFixed(2)}, score=${sharpnessScore.toFixed(1)}, isBlurry=${isBlurry}`);

  return {
    isBlurry,
    sharpnessScore: Math.round(sharpnessScore),
    variance,
  };
}

/**
 * Validate image quality for profile photos
 * Returns an error message if the image fails validation, null otherwise
 */
export const validateImageQuality = async (file: File): Promise<string | null> => {
  try {
    const result = await detectBlur(file);
    
    if (result.isBlurry) {
      return "La imagen parece borrosa. Por favor, sube una foto más nítida.";
    }
    
    return null;
  } catch (error) {
    console.error("Error validating image quality:", error);
    // Don't block upload on detection errors
    return null;
  }
};
