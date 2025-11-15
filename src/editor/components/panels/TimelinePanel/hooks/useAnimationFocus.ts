import { useEffect } from 'react';
import { useTimelineStore } from '@editor/store/timelineStore';

export interface IAnimationFocusState {
  focusedEntityId: number | null;
  isFocusMode: boolean;
}

/**
 * Hook to manage animation focus mode state.
 *
 * When the timeline panel opens with an active entity:
 * - Sets focus mode to true
 * - Tracks the focused entity ID
 *
 * This hook follows SRP by only managing the focus state.
 */
export const useAnimationFocus = (isOpen: boolean): IAnimationFocusState => {
  const activeEntityId = useTimelineStore((s) => s.activeEntityId);

  // Focus mode is active when timeline is open and has an active entity
  const isFocusMode = isOpen && activeEntityId !== null;

  useEffect(() => {
    // Clean up focus state when timeline closes
    if (!isOpen) {
      // Any cleanup can go here in the future
    }
  }, [isOpen]);

  return {
    focusedEntityId: activeEntityId,
    isFocusMode,
  };
};
