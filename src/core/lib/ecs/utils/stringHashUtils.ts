/**
 * String hashing utilities for ECS component storage
 * Provides efficient string-to-hash conversion and reverse lookup
 */

// Map to store string values by their hashes for reverse lookup
const stringHashMap = new Map<number, string>();

/**
 * Simple hash function for strings to convert to uint32
 */
export const hashString = (str: string): number => {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

/**
 * Helper to store and hash a string
 */
export const storeString = (str: string): number => {
  const hash = hashString(str);
  stringHashMap.set(hash, str);
  return hash;
};

/**
 * Helper to retrieve string from hash
 */
export const getStringFromHash = (hash: number): string => {
  return stringHashMap.get(hash) || '';
};

/**
 * Clear all stored strings (useful for cleanup)
 */
export const clearStringCache = (): void => {
  stringHashMap.clear();
};

/**
 * Get cache size for debugging
 */
export const getStringCacheSize = (): number => {
  return stringHashMap.size;
};
