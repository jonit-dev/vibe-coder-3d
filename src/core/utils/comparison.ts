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
  next: IRenderingContributions['material'],
): boolean => {
  // Handle null/undefined cases
  if (!prev && !next) return true;
  if (!prev || !next) return false;

  // Check all material properties, with special handling for color
  return MATERIAL_PROPS_TO_CHECK.every((key) => {
    const prevVal = prev[key];
    const nextVal = next[key];

    // Special handling for color property which can be string or object
    if (key === 'color') {
      if (typeof prevVal === 'string' && typeof nextVal === 'string') {
        return prevVal === nextVal;
      }
      if (typeof prevVal === 'object' && typeof nextVal === 'object' && prevVal && nextVal) {
        const prevColor = prevVal as { r: number; g: number; b: number };
        const nextColor = nextVal as { r: number; g: number; b: number };
        return (
          prevColor.r === nextColor.r && prevColor.g === nextColor.g && prevColor.b === nextColor.b
        );
      }
      return prevVal === nextVal;
    }

    return prevVal === nextVal;
  });
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
  keys?: (keyof T)[],
): boolean => {
  const keysToCheck = keys || (Object.keys(a) as (keyof T)[]);
  return keysToCheck.every((key) => a[key] === b[key]);
};

/**
 * Deep equality check for component data without JSON.stringify
 * Uses recursive comparison for nested objects/arrays
 * PERFORMANCE: Faster than JSON.stringify for most component data
 */
export const deepEqual = (a: unknown, b: unknown): boolean => {
  // Primitive or reference equality
  if (a === b) return true;

  // Null/undefined checks
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, idx) => deepEqual(item, b[idx]));
  }

  // Handle objects
  if (typeof a === 'object' && typeof b === 'object') {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);

    if (aKeys.length !== bKeys.length) return false;

    return aKeys.every((key) => deepEqual(aObj[key], bObj[key]));
  }

  return false;
};
