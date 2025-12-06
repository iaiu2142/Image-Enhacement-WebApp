
import { EnhancementOptions, PixelData } from '../types';

/**
 * Extracts pixel data (ImageData) from an HTMLImageElement.
 * @param image The HTMLImageElement to process.
 * @returns PixelData object containing the Uint8ClampedArray and dimensions.
 * @throws Error if canvas context cannot be obtained.
 */
export const getImagePixelData = (image: HTMLImageElement): PixelData => {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Could not get canvas context for image pixel data extraction.');
  }
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { data: imageData.data, width: imageData.width, height: imageData.height };
};

/**
 * Creates an HTMLImageElement from pixel data.
 * @param pixelData PixelData object containing the Uint8ClampedArray and dimensions.
 * @returns A Promise that resolves with the created HTMLImageElement.
 * @throws Error if canvas context cannot be obtained.
 */
export const createImageFromPixelData = (pixelData: PixelData): Promise<HTMLImageElement> => {
  const canvas = document.createElement('canvas');
  canvas.width = pixelData.width;
  canvas.height = pixelData.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context for image creation from pixel data.');
  }
  const imageData = new ImageData(pixelData.data, pixelData.width, pixelData.height);
  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (error) => {
      console.error('Error creating image from canvas:', error);
      reject(new Error('Failed to create image from canvas.'));
    };
    img.src = canvas.toDataURL('image/png'); // Use PNG for better quality with transparency
  });
};

/**
 * Applies selected image enhancement filters sequentially to pixel data.
 * @param originalPixelData The original pixel data of the image.
 * @param options An object indicating which enhancements to apply.
 * @returns PixelData object with the applied enhancements.
 */
export const applyEnhancements = (
  originalPixelData: PixelData,
  options: EnhancementOptions,
): PixelData => {
  // Create a mutable copy of the pixel data to apply filters incrementally
  let processedData = new Uint8ClampedArray(originalPixelData.data);
  const width = originalPixelData.width;
  const height = originalPixelData.height;

  // Apply filters based on selected options
  if (options.contrast) {
    processedData = applyContrast(processedData, width, height, 1.2); // Default contrast factor
  }
  if (options.brightness) {
    processedData = applyBrightness(processedData, width, height, 1.1); // Default brightness factor
  }
  if (options.sharpening) {
    processedData = applySharpen(processedData, width, height);
  }
  if (options.color) {
    processedData = applyColorEnhancement(processedData, width, height, 1.15); // Default saturation factor
  }
  if (options.noiseReduction) {
    processedData = applyNoiseReduction(processedData, width, height);
  }

  return { data: processedData, width, height };
};

/**
 * Applies brightness adjustment to image pixels.
 * @param pixels The pixel data (Uint8ClampedArray).
 * @param width Image width.
 * @param height Image height.
 * @param factor Brightness factor (e.g., 1.1 for 10% brighter, 0.9 for 10% darker).
 * @returns New Uint8ClampedArray with adjusted brightness.
 */
const applyBrightness = (
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  factor: number
): Uint8ClampedArray => {
  const newPixels = new Uint8ClampedArray(pixels.length);
  for (let i = 0; i < pixels.length; i += 4) {
    newPixels[i] = Math.min(255, Math.max(0, pixels[i] * factor));
    newPixels[i + 1] = Math.min(255, Math.max(0, pixels[i + 1] * factor));
    newPixels[i + 2] = Math.min(255, Math.max(0, pixels[i + 2] * factor));
    newPixels[i + 3] = pixels[i + 3]; // Preserve alpha channel
  }
  return newPixels;
};

/**
 * Applies contrast adjustment to image pixels.
 * @param pixels The pixel data (Uint8ClampedArray).
 * @param width Image width.
 * @param height Image height.
 * @param factor Contrast factor (e.g., 1.2 for more contrast, 0.8 for less).
 * @returns New Uint8ClampedArray with adjusted contrast.
 */
const applyContrast = (
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  factor: number
): Uint8ClampedArray => {
  const newPixels = new Uint8ClampedArray(pixels.length);
  // Calculate average luminance to pivot contrast around
  let avgLum = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    avgLum += (0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2]);
  }
  avgLum /= (pixels.length / 4);

  for (let i = 0; i < pixels.length; i += 4) {
    newPixels[i] = Math.min(255, Math.max(0, factor * (pixels[i] - avgLum) + avgLum));
    newPixels[i + 1] = Math.min(255, Math.max(0, factor * (pixels[i + 1] - avgLum) + avgLum));
    newPixels[i + 2] = Math.min(255, Math.max(0, factor * (pixels[i + 2] - avgLum) + avgLum));
    newPixels[i + 3] = pixels[i + 3]; // Preserve alpha channel
  }
  return newPixels;
};

/**
 * Applies sharpening to image pixels using a 3x3 Laplacian kernel.
 * @param pixels The pixel data (Uint8ClampedArray).
 * @param width Image width.
 * @param height Image height.
 * @returns New Uint8ClampedArray with sharpened image.
 */
const applySharpen = (
  pixels: Uint8ClampedArray,
  width: number,
  height: number
): Uint8ClampedArray => {
  const newPixels = new Uint8ClampedArray(pixels.length);
  // Sharpening kernel
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ];
  const kernelSize = 3;
  const kernelRadius = Math.floor(kernelSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;
      for (let ky = -kernelRadius; ky <= kernelRadius; ky++) {
        for (let kx = -kernelRadius; kx <= kernelRadius; kx++) {
          const pixelX = x + kx;
          const pixelY = y + ky;
          if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
            const kernelValue = kernel[(ky + kernelRadius) * kernelSize + (kx + kernelRadius)];
            const index = (pixelY * width + pixelX) * 4;
            r += pixels[index] * kernelValue;
            g += pixels[index + 1] * kernelValue;
            b += pixels[index + 2] * kernelValue;
          }
        }
      }
      const outputIndex = (y * width + x) * 4;
      newPixels[outputIndex] = Math.min(255, Math.max(0, r));
      newPixels[outputIndex + 1] = Math.min(255, Math.max(0, g));
      newPixels[outputIndex + 2] = Math.min(255, Math.max(0, b));
      newPixels[outputIndex + 3] = pixels[outputIndex + 3]; // Preserve alpha
    }
  }
  return newPixels;
};

/**
 * Applies color enhancement (saturation boost) to image pixels.
 * @param pixels The pixel data (Uint8ClampedArray).
 * @param width Image width.
 * @param height Image height.
 * @param saturationFactor Factor to boost saturation (e.g., 1.15 for a subtle boost).
 * @returns New Uint8ClampedArray with adjusted color saturation.
 */
const applyColorEnhancement = (
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  saturationFactor: number = 1.15
): Uint8ClampedArray => {
  const newPixels = new Uint8ClampedArray(pixels.length);

  // Helper function to convert HSL to RGB
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i] / 255;
    const g = pixels[i + 1] / 255;
    const b = pixels[i + 2] / 255;

    // Convert RGB to HSL
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    const delta = max - min;

    if (delta !== 0) {
      s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
      switch (max) {
        case r: h = (g - b) / delta + (g < b ? 6 : 0); break;
        case g: h = (b - r) / delta + 2; break;
        case b: h = (r - g) / delta + 4; break;
      }
      h /= 6;
    }

    // Apply saturation boost
    s = Math.min(1, s * saturationFactor);

    // Convert HSL back to RGB
    let R_prime, G_prime, B_prime;
    if (s === 0) {
      R_prime = G_prime = B_prime = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      R_prime = hue2rgb(p, q, h + 1 / 3);
      G_prime = hue2rgb(p, q, h);
      B_prime = hue2rgb(p, q, h - 1 / 3);
    }

    newPixels[i] = Math.min(255, Math.max(0, Math.round(R_prime * 255)));
    newPixels[i + 1] = Math.min(255, Math.max(0, Math.round(G_prime * 255)));
    newPixels[i + 2] = Math.min(255, Math.max(0, Math.round(B_prime * 255)));
    newPixels[i + 3] = pixels[i + 3]; // Preserve alpha
  }
  return newPixels;
};

/**
 * Applies a simple 3x3 box blur for noise reduction to image pixels.
 * @param pixels The pixel data (Uint8ClampedArray).
 * @param width Image width.
 * @param height Image height.
 * @returns New Uint8ClampedArray with reduced noise.
 */
const applyNoiseReduction = (
  pixels: Uint8ClampedArray,
  width: number,
  height: number
): Uint8ClampedArray => {
  const newPixels = new Uint8ClampedArray(pixels.length);
  // 3x3 Box blur kernel
  const kernel = [
    1, 1, 1,
    1, 1, 1,
    1, 1, 1
  ];
  const kernelSize = 3;
  const kernelRadius = Math.floor(kernelSize / 2);
  const kernelSum = kernel.reduce((a, b) => a + b, 0); // Should be 9 for a 3x3 box blur

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, count = 0;
      for (let ky = -kernelRadius; ky <= kernelRadius; ky++) {
        for (let kx = -kernelRadius; kx <= kernelRadius; kx++) {
          const pixelX = x + kx;
          const pixelY = y + ky;
          if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
            const index = (pixelY * width + pixelX) * 4;
            r += pixels[index];
            g += pixels[index + 1];
            b += pixels[index + 2];
            count++;
          }
        }
      }
      const outputIndex = (y * width + x) * 4;
      // Average the values, ensuring division by actual count for edge pixels
      newPixels[outputIndex] = Math.round(r / count);
      newPixels[outputIndex + 1] = Math.round(g / count);
      newPixels[outputIndex + 2] = Math.round(b / count);
      newPixels[outputIndex + 3] = pixels[outputIndex + 3]; // Preserve alpha
    }
  }
  return newPixels;
};
