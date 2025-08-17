import type { ICameraData, ILightData, IMeshRendererData } from './types';

// Type guards
export const isMeshRendererData = (data: unknown): data is IMeshRendererData => {
  return typeof data === 'object' && data !== null;
};

export const isCameraData = (data: unknown): data is ICameraData => {
  return typeof data === 'object' && data !== null;
};

export const isLightData = (data: unknown): data is ILightData => {
  return typeof data === 'object' && data !== null;
};

// Helper function to convert color string to RGB object
export const parseColorToRGB = (
  color: string | { r: number; g: number; b: number } | undefined,
): { r: number; g: number; b: number } | undefined => {
  if (!color) return undefined;

  if (typeof color === 'object') {
    return color;
  }

  // Handle hex color strings
  if (typeof color === 'string' && color.startsWith('#')) {
    const hex = color.substring(1);
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return { r, g, b };
  }

  return undefined;
};
