/**
 * Tags/Groups System
 *
 * Inspired by Godot Groups and Unity Tags, this system allows tagging objects
 * for efficient querying from anywhere in the application.
 */

// Main registry that stores all tagged objects grouped by tag name
const tagRegistry = new Map<string, Set<React.RefObject<unknown>>>();

/**
 * Register a tag entry
 * @param tagName The tag name to register under
 * @param ref Reference to the object being tagged
 */
export const registerTag = (tagName: string, ref: React.RefObject<unknown>): void => {
  if (!tagRegistry.has(tagName)) {
    tagRegistry.set(tagName, new Set());
  }

  const tagSet = tagRegistry.get(tagName);
  tagSet?.add(ref);
};

/**
 * Unregister a tag entry
 * @param tagName The tag name to unregister from
 * @param ref Reference to the object being untagged
 */
export const unregisterTag = (tagName: string, ref: React.RefObject<unknown>): void => {
  const tagSet = tagRegistry.get(tagName);
  if (tagSet) {
    tagSet.delete(ref);

    // Clean up empty tag sets
    if (tagSet.size === 0) {
      tagRegistry.delete(tagName);
    }
  }
};

/**
 * Get all nodes (refs) matching a tag
 * @param tagName The tag to query for
 * @returns Array of refs with the specified tag
 */
export const getNodes = <T>(tagName: string): React.RefObject<T>[] => {
  const tagSet = tagRegistry.get(tagName);
  if (!tagSet) return [];

  // Convert Set to Array with proper typing
  return Array.from(tagSet) as React.RefObject<T>[];
};

/**
 * Clear all tags of a specific name
 * @param tagName The tag to clear
 */
export const clearTag = (tagName: string): void => {
  tagRegistry.delete(tagName);
};

/**
 * Clear all tags in the registry
 */
export const clearAllTags = (): void => {
  tagRegistry.clear();
};

/**
 * Get all tags in the registry
 * @returns Array of all tag names
 */
export const getAllTags = (): string[] => {
  return Array.from(tagRegistry.keys());
};

/**
 * Debug function to get the count of objects for each tag
 * @returns Map of tag names to counts
 */
export const getTagCounts = (): Record<string, number> => {
  const counts: Record<string, number> = {};

  tagRegistry.forEach((set, tag) => {
    counts[tag] = set.size;
  });

  return counts;
};
