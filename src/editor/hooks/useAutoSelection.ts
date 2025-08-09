import { useEffect, useRef } from 'react';

interface IUseAutoSelectionProps {
  selectedId: number | null;
  entityIds: number[];
  setSelectedId: (id: number | null) => void;
}

export const useAutoSelection = ({
  selectedId,
  entityIds,
  setSelectedId,
}: IUseAutoSelectionProps) => {
  const previousEntityIds = useRef<number[]>([]);
  const wasDeleted = useRef(false);
  const lastDeletionTime = useRef(0);

  useEffect(() => {
    // Check if an entity was just deleted
    const currentIds = entityIds;
    const prevIds = previousEntityIds.current;

    // If we have fewer entities than before, something was deleted
    if (prevIds.length > currentIds.length) {
      wasDeleted.current = true;
      lastDeletionTime.current = Date.now();
      console.log('[AutoSelection] Entity deletion detected, preventing auto-selection');
    }

    // Clear deletion flag after a short delay to prevent race conditions
    if (wasDeleted.current && Date.now() - lastDeletionTime.current > 100) {
      wasDeleted.current = false;
      console.log('[AutoSelection] Deletion flag cleared');
    }

    // Only auto-select in these cases:
    // 1. No current selection and entities are available (first time or manual clear)
    // 2. Selected entity is invalid AND it wasn't due to deletion (corrupted state)
    // Prevent auto-selection when entity was just selected but not yet in entityIds (race condition)
    const isNewlySelected = selectedId !== null && !previousEntityIds.current.includes(selectedId);

    const shouldAutoSelect =
      (selectedId === null && entityIds.length > 0 && !wasDeleted.current) ||
      (selectedId !== null &&
        !entityIds.includes(selectedId) &&
        entityIds.length > 0 &&
        !wasDeleted.current &&
        !isNewlySelected);

    if (shouldAutoSelect) {
      console.log('[AutoSelection] Auto-selecting entity:', entityIds[0]);
      setSelectedId(entityIds[0]);
    } else if (isNewlySelected && !entityIds.includes(selectedId)) {
      // Newly selected entity not yet synchronized - this is expected
      console.log(
        '[AutoSelection] Newly selected entity not yet in list, waiting for sync:',
        selectedId,
      );
    } else if (selectedId !== null && !entityIds.includes(selectedId)) {
      // If selected entity no longer exists and it was due to deletion, clear selection
      console.log('[AutoSelection] Selected entity no longer exists, clearing selection');
      setSelectedId(null);
    }

    // Update previous entity list for next comparison
    previousEntityIds.current = [...entityIds];
  }, [selectedId, entityIds, setSelectedId]);
};
