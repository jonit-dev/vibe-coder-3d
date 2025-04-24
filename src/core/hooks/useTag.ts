import { RefObject, useEffect } from 'react';

import { registerTag, unregisterTag } from '@/core/lib/tags';

/**
 * Hook for tagging objects to enable efficient querying.
 *
 * @param tagName The tag to register this object under
 * @param ref Reference to the object to tag
 * @param enabled Optional flag to conditionally enable/disable tagging
 */
export const useTag = <T>(tagName: string, ref: RefObject<T>, enabled: boolean = true): void => {
  useEffect(() => {
    // Only register if enabled
    if (!enabled) return;

    // Register this ref with the tag system
    registerTag(tagName, ref);

    // Clean up when unmounting or when tag name changes
    return () => {
      unregisterTag(tagName, ref);
    };
  }, [tagName, ref, enabled]); // Re-run if any of these change
};
