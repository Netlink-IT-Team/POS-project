/**
 * Client-side image compression utility
 * Compresses physical audit photos to max dimension <= 1280px and ~200-300KB JPEG
 * as required by PRD Section 4 & 8.
 */

export interface CompressionResult {
  dataUrl: string;
  originalSizeKB: number;
  compressedSizeKB: number;
  width: number;
  height: number;
}

export async function compressAuditPhoto(
  fileOrDataUrl: File | string,
  maxWidth: number = 1280,
  maxHeight: number = 1280,
  quality: number = 0.8
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    // If it's a File object (from file/camera input)
    if (typeof fileOrDataUrl !== 'string') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        processImage(dataUrl, fileOrDataUrl.size / 1024);
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrDataUrl);
    } else {
      processImage(fileOrDataUrl, Math.round((fileOrDataUrl.length * 0.75) / 1024));
    }

    function processImage(src: string, originalSizeKB: number) {
      // Check if running in browser / web environment
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        resolve({
          dataUrl: src,
          originalSizeKB,
          compressedSizeKB: originalSizeKB,
          width: 1280,
          height: 1280,
        });
        return;
      }

      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio scaling to max 1280px
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            maxHeight = maxHeight;
            height = Math.round((height * maxHeight) / img.height);
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            dataUrl: src,
            originalSizeKB,
            compressedSizeKB: originalSizeKB,
            width,
            height,
          });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with quality 0.8
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        const compressedSizeKB = Math.round((compressedDataUrl.length * 0.75) / 1024);

        resolve({
          dataUrl: compressedDataUrl,
          originalSizeKB: Math.round(originalSizeKB),
          compressedSizeKB,
          width,
          height,
        });
      };
      img.onerror = () => {
        resolve({
          dataUrl: src,
          originalSizeKB,
          compressedSizeKB: originalSizeKB,
          width: 800,
          height: 600,
        });
      };
      img.src = src;
    }
  });
}

