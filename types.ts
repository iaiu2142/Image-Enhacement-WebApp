
export interface EnhancementOptions {
  contrast: boolean;
  brightness: boolean;
  sharpening: boolean;
  color: boolean;
  noiseReduction: boolean;
}

export type EnhancementType = keyof EnhancementOptions;

export interface PixelData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}
