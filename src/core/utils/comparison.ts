/**
 * Performance-optimized comparison utilities for React memo
 * Avoids JSON.stringify in hot render paths
 */

import type { IRenderingContributions } from '@/editor/components/panels/ViewportPanel/hooks/useEntityMesh';

/**
 * Material properties to check for equality
 * Explicitly listed to avoid hidden property changes
 */
const MATERIAL_PROPS_TO_CHECK: Array<keyof NonNullable<IRenderingContributions['material']>> = [
  'shader',
  'materialType',
  'color',
  'metalness',
  'roughness',
  'emissive',
  'emissiveIntensity',
  'normalScale',
  'occlusionStrength',
  'textureOffsetX',
  'textureOffsetY',
  'textureRepeatX',
  'textureRepeatY',
  'albedoTexture',
  'normalTexture',
  'metallicTexture',
  'roughnessTexture',
  'emissiveTexture',
  'occlusionTexture',
];

/**
 * Fast shallow comparison of material objects
 * Replaces expensive JSON.stringify calls
 */
export const compareMaterials = (
  prev: IRenderingContributions['material'],
  next: IRenderingContributions['material']
): boolean => {
  // Handle null/undefined cases
  if (!prev && !next) return true;
  if (!prev || !next) return false;

  // Check all material properties using reference equality
  return MATERIAL_PROPS_TO_CHECK.every((key) => prev[key] === next[key]);
};

/**
 * Fast array comparison for primitive arrays
 * Uses reference equality for items
 */
export const compareArrays = <T>(a: T[] | undefined, b: T[] | undefined): boolean => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  return a.every((item, idx) => item === b[idx]);
};

/**
 * Shallow equality check for objects
 * Optionally checks only specific keys
 */
export const shallowEqual = <T extends Record<string, unknown>>(
  a: T,
  b: T,
  keys?: (keyof T)[]
): boolean => {
  const keysToCheck = keys || (Object.keys(a) as (keyof T)[]);
  return keysToCheck.every((key) => a[key] === b[key]);
};
