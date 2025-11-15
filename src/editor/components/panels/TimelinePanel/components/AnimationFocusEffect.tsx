import React from 'react';
import { useSceneFade } from '../hooks/useSceneFade';
import { useTimelineStore } from '@editor/store/timelineStore';
import { useEditorStore } from '@editor/store/editorStore';
import { AnimationFocusHighlight } from './AnimationFocusHighlight';

export interface IAnimationFocusEffectProps {
  isTimelineOpen: boolean;
  fadeOpacity?: number;
}

/**
 * Component that applies visual effects when in animation focus mode.
 * Must be rendered inside a Three.js Canvas.
 *
 * Effects:
 * - Fades out non-focused entities to help user concentrate on the animated entity
 * - Shows a pulsing highlight ring around the focused entity
 *
 * This component follows SRP by only managing the visual effects in the 3D scene.
 * It reads state from the timeline store directly to avoid prop drilling.
 */
export const AnimationFocusEffect: React.FC<IAnimationFocusEffectProps> = ({
  isTimelineOpen,
  fadeOpacity = 0.2,
}) => {
  // Read focus state from timeline store
  const activeEntityId = useTimelineStore((s) => s.activeEntityId);
  const setIsOpen = useTimelineStore((s) => s.setIsOpen);

  // Watch for selection changes
  const selectedIds = useEditorStore((s) => s.selectedIds);

  // Close timeline when selection changes to a different entity
  React.useEffect(() => {
    if (!isTimelineOpen || activeEntityId === null) {
      return;
    }

    // If the active entity is no longer selected, close the timeline
    if (!selectedIds.includes(activeEntityId)) {
      console.log('[AnimationFocusEffect] Active entity deselected, closing timeline', {
        activeEntityId,
        selectedIds,
      });
      setIsOpen(false);
    }
  }, [selectedIds, activeEntityId, isTimelineOpen, setIsOpen]);

  // Focus mode is active when timeline is open and has an active entity
  const isFocusMode = isTimelineOpen && activeEntityId !== null;

  // Debug logging
  React.useEffect(() => {
    console.log('[AnimationFocusEffect] Props changed:', {
      isTimelineOpen,
      activeEntityId,
      isFocusMode,
    });
  }, [isTimelineOpen, activeEntityId, isFocusMode]);

  // Apply scene fade effect
  useSceneFade({ focusedEntityId: activeEntityId, isFocusMode, fadeOpacity });

  // Render highlight ring around focused entity
  return <AnimationFocusHighlight entityId={activeEntityId} isFocusMode={isFocusMode} />;
};
