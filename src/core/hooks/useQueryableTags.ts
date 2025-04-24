import { useCallback, useEffect, useState } from 'react';

import { getNodes, getTagCounts } from '@/core/lib/tags';

/**
 * Hook to simplify working with tag queries in components
 * Provides an easy way to get and filter objects by tags
 * with automatic re-fetching when tag counts change
 */
export function useQueryableTags() {
  const [tagUpdateCount, setTagUpdateCount] = useState(0);

  // Force a refresh of tag queries
  const refreshTags = useCallback(() => {
    setTagUpdateCount((prev) => prev + 1);
  }, []);

  // Setup a periodic refresh to ensure tag queries are up-to-date
  useEffect(() => {
    const interval = setInterval(() => {
      refreshTags();
    }, 1000); // Refresh every second - can be adjusted

    return () => clearInterval(interval);
  }, [refreshTags]);

  /**
   * Get all objects with a specific tag
   * @param tagName Name of the tag to query
   * @returns Array of refs matching the tag
   */
  const getByTag = useCallback(
    <T>(tagName: string): React.RefObject<T>[] => {
      return getNodes<T>(tagName);
    },
    [tagUpdateCount],
  );

  /**
   * Find objects matching multiple tags (intersection)
   * @param tags Array of tag names to match
   * @returns Array of refs that have all the specified tags
   */
  const getByAllTags = useCallback(
    <T>(tags: string[]): React.RefObject<T>[] => {
      if (tags.length === 0) return [];
      if (tags.length === 1) return getNodes<T>(tags[0]);

      // Get first tag set
      const result = new Set(getNodes<T>(tags[0]));

      // Filter by remaining tags
      for (let i = 1; i < tags.length; i++) {
        const tagSet = new Set(getNodes<T>(tags[i]));

        // Keep only refs that exist in both sets
        for (const ref of result) {
          if (!tagSet.has(ref)) {
            result.delete(ref);
          }
        }
      }

      return Array.from(result);
    },
    [tagUpdateCount],
  );

  /**
   * Find objects matching any of the given tags (union)
   * @param tags Array of tag names to match
   * @returns Array of refs that have at least one of the specified tags
   */
  const getByAnyTag = useCallback(
    <T>(tags: string[]): React.RefObject<T>[] => {
      if (tags.length === 0) return [];
      if (tags.length === 1) return getNodes<T>(tags[0]);

      // Create a set to hold unique refs
      const result = new Set<React.RefObject<T>>();

      // Add refs from all tags
      for (const tag of tags) {
        const nodes = getNodes<T>(tag);
        nodes.forEach((node) => result.add(node));
      }

      return Array.from(result);
    },
    [tagUpdateCount],
  );

  /**
   * Find objects that have one tag but explicitly not another
   * @param includeTag Tag that objects must have
   * @param excludeTag Tag that objects must not have
   * @returns Array of refs matching the criteria
   */
  const getByTagExcluding = useCallback(
    <T>(includeTag: string, excludeTag: string): React.RefObject<T>[] => {
      const included = new Set(getNodes<T>(includeTag));
      const excluded = new Set(getNodes<T>(excludeTag));

      // Remove excluded refs
      for (const ref of excluded) {
        included.delete(ref);
      }

      return Array.from(included);
    },
    [tagUpdateCount],
  );

  /**
   * Count objects by tag
   * @param tagName Tag to count
   * @returns Number of objects with the tag
   */
  const countByTag = useCallback(
    (tagName: string): number => {
      const counts = getTagCounts();
      return counts[tagName] || 0;
    },
    [tagUpdateCount],
  );

  return {
    getByTag,
    getByAllTags,
    getByAnyTag,
    getByTagExcluding,
    countByTag,
    refreshTags,
  };
}
