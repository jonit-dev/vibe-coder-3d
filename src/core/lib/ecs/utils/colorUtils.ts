/**
 * Color conversion utilities for ECS components
 * Handles hex/RGB conversions for material properties
 */

export const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255]
    : [0, 0, 0];
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (c: number) => {
    // Clamp values to 0-1 range
    const clamped = Math.max(0, Math.min(1, c));
    const hex = Math.round(clamped * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Helper to set RGB values in BitECS component arrays
 */
export const setRgbValues = (
  target: { r: Float32Array; g: Float32Array; b: Float32Array },
  eid: number,
  hex: string,
) => {
  const [r, g, b] = hexToRgb(hex);
  target.r[eid] = r;
  target.g[eid] = g;
  target.b[eid] = b;
};

/**
 * Helper to get hex color from BitECS component arrays
 */
export const getRgbAsHex = (
  source: { r: Float32Array; g: Float32Array; b: Float32Array },
  eid: number,
): string => {
  return rgbToHex(source.r[eid], source.g[eid], source.b[eid]);
};
