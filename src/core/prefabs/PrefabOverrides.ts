import type { IPrefabOverrideRules } from './Prefab.types';
import { Logger } from '@/core/lib/logger';

const logger = Logger.create('PrefabOverrides');

/**
 * Deep equality check for simple objects
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;

  const keysA = Object.keys(aObj);
  const keysB = Object.keys(bObj);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(aObj[key], bObj[key])) return false;
  }

  return true;
}

/**
 * Compute minimal diff between base and current state
 */
export function computeOverridePatch(base: unknown, current: unknown): unknown {
  if (deepEqual(base, current)) {
    return undefined;
  }

  if (typeof base !== 'object' || typeof current !== 'object' || base == null || current == null) {
    return current;
  }

  const baseObj = base as Record<string, unknown>;
  const currentObj = current as Record<string, unknown>;
  const patch: Record<string, unknown> = {};

  // Check for modified and added keys
  for (const key of Object.keys(currentObj)) {
    if (!(key in baseObj)) {
      // New key added
      patch[key] = currentObj[key];
    } else if (!deepEqual(baseObj[key], currentObj[key])) {
      // Value changed
      const nestedPatch = computeOverridePatch(baseObj[key], currentObj[key]);
      if (nestedPatch !== undefined) {
        patch[key] = nestedPatch;
      }
    }
  }

  // Check for removed keys
  for (const key of Object.keys(baseObj)) {
    if (!(key in currentObj)) {
      patch[key] = null; // Mark as removed
    }
  }

  return Object.keys(patch).length > 0 ? patch : undefined;
}

/**
 * Apply override patch to base with validation rules
 */
export function applyOverridePatch<T>(base: T, patch?: unknown, rules?: IPrefabOverrideRules): T {
  if (!patch) {
    return base;
  }

  const allowStructural = rules?.allowStructuralChanges ?? false;

  if (typeof base !== 'object' || base == null) {
    return patch as T;
  }

  if (typeof patch !== 'object' || patch == null) {
    logger.warn('Invalid patch format, expected object');
    return base;
  }

  const baseObj = base as Record<string, unknown>;
  const patchObj = patch as Record<string, unknown>;
  const result = { ...baseObj };

  for (const [key, value] of Object.entries(patchObj)) {
    if (value === null) {
      // Deletion
      if (allowStructural) {
        delete result[key];
      } else {
        logger.warn(`Structural change not allowed: deletion of key "${key}"`);
      }
    } else if (!(key in baseObj)) {
      // Addition
      if (allowStructural) {
        result[key] = value;
      } else {
        logger.warn(`Structural change not allowed: addition of key "${key}"`);
      }
    } else {
      // Modification
      if (typeof baseObj[key] === 'object' && typeof value === 'object') {
        result[key] = applyOverridePatch(baseObj[key], value, rules);
      } else {
        result[key] = value;
      }
    }
  }

  return result as T;
}

/**
 * Merge multiple patches in order
 */
export function mergePatches(...patches: unknown[]): unknown {
  let result: unknown = {};

  for (const patch of patches) {
    result = applyOverridePatch(result, patch);
  }

  return result;
}

/**
 * Validate that patch doesn't contain structural changes
 */
export function validatePatch(base: unknown, patch: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!patch || typeof patch !== 'object') {
    return { valid: true, errors: [] };
  }

  if (typeof base !== 'object' || base == null) {
    return { valid: true, errors: [] };
  }

  const baseObj = base as Record<string, unknown>;
  const patchObj = patch as Record<string, unknown>;

  for (const [key, value] of Object.entries(patchObj)) {
    if (value === null && key in baseObj) {
      errors.push(`Structural change: deletion of key "${key}"`);
    } else if (!(key in baseObj)) {
      errors.push(`Structural change: addition of key "${key}"`);
    } else if (typeof baseObj[key] === 'object' && typeof value === 'object') {
      const nested = validatePatch(baseObj[key], value);
      errors.push(...nested.errors);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Reset entity to prefab defaults (clear overrides)
 */
export function clearOverrides<T>(base: T): T {
  return JSON.parse(JSON.stringify(base));
}
