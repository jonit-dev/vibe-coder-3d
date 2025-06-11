// Math utilities for the game engine
export const add = (a: number, b: number): number => a + b;

export const multiply = (a: number, b: number): number => a * b;

export const isEven = (n: number): boolean => n % 2 === 0;

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export const lerp = (start: number, end: number, t: number): number =>
  start + (end - start) * clamp(t, 0, 1);

export const degToRad = (degrees: number): number => degrees * (Math.PI / 180);

export const radToDeg = (radians: number): number => radians * (180 / Math.PI);

export const roundToDecimals = (value: number, decimals: number): number =>
  Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
