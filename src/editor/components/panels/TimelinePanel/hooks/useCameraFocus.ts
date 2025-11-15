import { useEffect } from 'react';
import { Logger } from '@core/lib/logger';

const logger = Logger.create('useCameraFocus');

export interface ICameraFocusOptions {
  focusedEntityId: number | null;
  isFocusMode: boolean;
  enabled?: boolean; // Allow disabling the auto-focus
}

/**
 * Hook to automatically frame the camera on the focused entity.
 *
 * This hook follows SRP by only managing the camera framing behavior.
 * It uses the existing window.__frameEntity function for the actual framing.
 */
export const useCameraFocus = ({
  focusedEntityId,
  isFocusMode,
  enabled = true,
}: ICameraFocusOptions): void => {
  useEffect(() => {
    if (!isFocusMode || focusedEntityId === null || !enabled) {
      return;
    }

    // Small delay to allow the timeline panel to open fully before framing
    const timeoutId = setTimeout(() => {
      try {
        const windowWithFrameEntity = window as Window & {
          __frameEntity?: (entityId: number) => void;
        };

        if (windowWithFrameEntity.__frameEntity) {
          logger.debug('Framing camera on focused entity', { focusedEntityId });
          windowWithFrameEntity.__frameEntity(focusedEntityId);
        } else {
          logger.warn('Frame function not available on window');
        }
      } catch (error) {
        logger.error('Error during camera framing:', error);
      }
    }, 100); // Small delay for smooth transition

    return () => {
      clearTimeout(timeoutId);
    };
  }, [focusedEntityId, isFocusMode, enabled]);
};
