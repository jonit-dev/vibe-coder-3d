/**
 * Default Omission Utility
 * Compares component data against default values and omits matching fields
 * Reduces scene file size by 50-70% by only serializing changed values
 */

/**
 * Round numeric values to specified decimal places
 * Reduces file size and improves readability while maintaining sufficient precision
 */
export function roundPrecision(value: number, decimals: number = 6): number {
  if (!Number.isFinite(value)) return value;
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Deep equality check for primitives and simple objects/arrays
 * Uses epsilon tolerance for numeric comparisons to handle floating point precision
 */
function deepEqual(a: unknown, b: unknown, epsilon: number = 1e-6): boolean {
  // Exact match (handles null, undefined, same reference)
  if (a === b) return true;

  // Null/undefined check
  if (a == null || b == null) return false;

  // Type mismatch
  if (typeof a !== typeof b) return false;

  // Handle numbers with precision tolerance
  if (typeof a === 'number' && typeof b === 'number') {
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      return a === b; // NaN, Infinity handling
    }
    return Math.abs(a - b) < epsilon;
  }

  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => deepEqual(val, b[idx], epsilon));
  }

  // Handle objects
  if (typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a as object).sort();
    const bKeys = Object.keys(b as object).sort();

    // Different number of keys
    if (aKeys.length !== bKeys.length) return false;

    // Different key sets
    if (!aKeys.every((key, idx) => key === bKeys[idx])) return false;

    // Compare all values
    return aKeys.every((key) =>
      deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key], epsilon),
    );
  }

  // Primitive equality (string, boolean, symbol)
  return false;
}

/**
 * Process a value for serialization:
 * - Round numbers to 6 decimal places
 * - Recursively process nested objects/arrays
 */
function processValue(value: unknown): unknown {
  if (typeof value === 'number') {
    return roundPrecision(value);
  }

  if (Array.isArray(value)) {
    return value.map(processValue);
  }

  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = processValue(v);
    }
    return result;
  }

  return value;
}

/**
 * Omit fields from object that match default values
 * Performs deep comparison and handles nested objects
 *
 * @param data - The data object to filter
 * @param defaults - The default values to compare against
 * @param processNumbers - Whether to round numeric precision (default: true)
 * @returns Object with only non-default values
 */
export function omitDefaults<T extends Record<string, unknown>>(
  data: T,
  defaults: Record<string, unknown>,
  processNumbers: boolean = true,
): Partial<T> {
  const result: Partial<T> = {};

  for (const [key, value] of Object.entries(data)) {
    const defaultValue = defaults[key];

    // Process value (round numbers, etc.)
    const processedValue = processNumbers ? processValue(value) : value;

    // Handle nested objects (but not arrays - arrays are compared as-is)
    if (
      processedValue &&
      typeof processedValue === 'object' &&
      !Array.isArray(processedValue) &&
      defaultValue &&
      typeof defaultValue === 'object' &&
      !Array.isArray(defaultValue)
    ) {
      const nestedResult = omitDefaults(
        processedValue as Record<string, unknown>,
        defaultValue as Record<string, unknown>,
        processNumbers,
      );

      // Only include if nested object has non-default values
      if (Object.keys(nestedResult).length > 0) {
        result[key as keyof T] = nestedResult as T[keyof T];
      }
      continue;
    }

    // Compare processed value against default
    if (!deepEqual(processedValue, defaultValue)) {
      result[key as keyof T] = processedValue as T[keyof T];
    }
  }

  return result;
}

/**
 * Restore default values for omitted fields
 * Performs deep merge, preserving nested objects
 *
 * @param data - Partial data object (with omitted defaults)
 * @param defaults - Default values to restore
 * @returns Complete object with defaults restored
 */
export function restoreDefaults<T extends Record<string, unknown>>(
  data: Partial<T>,
  defaults: Record<string, unknown>,
): T {
  const result = { ...defaults } as T;

  for (const [key, value] of Object.entries(data)) {
    // Handle nested objects (but not arrays - arrays override completely)
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      defaults[key] &&
      typeof defaults[key] === 'object' &&
      !Array.isArray(defaults[key])
    ) {
      result[key as keyof T] = restoreDefaults(
        value as Record<string, unknown>,
        defaults[key] as Record<string, unknown>,
      ) as T[keyof T];
    } else {
      // Primitive or array - override default
      result[key as keyof T] = value as T[keyof T];
    }
  }

  return result;
}

/**
 * Calculate compression ratio from before/after string sizes
 */
export function calculateCompressionRatio(original: string, compressed: string): number {
  const originalSize = original.length;
  const compressedSize = compressed.length;

  if (originalSize === 0) return 0;

  return ((originalSize - compressedSize) / originalSize) * 100;
}

/**
 * Get size difference in a human-readable format
 */
export function formatSizeReduction(originalSize: number, compressedSize: number): string {
  const reduction = originalSize - compressedSize;
  const ratio = ((reduction / originalSize) * 100).toFixed(1);
  return `${reduction} chars (-${ratio}%)`;
}

/**
 * Batch omit defaults for multiple objects
 * Useful for processing arrays of entities
 */
export function omitDefaultsBatch<T extends Record<string, unknown>>(
  items: T[],
  defaults: Record<string, unknown>,
  processNumbers: boolean = true,
): Partial<T>[] {
  return items.map((item) => omitDefaults(item, defaults, processNumbers));
}

/**
 * Batch restore defaults for multiple objects
 */
export function restoreDefaultsBatch<T extends Record<string, unknown>>(
  items: Partial<T>[],
  defaults: Record<string, unknown>,
): T[] {
  return items.map((item) => restoreDefaults(item, defaults));
}
