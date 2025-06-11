import { useCallback } from 'react';

import { useEditorStore } from '@/editor/store/editorStore';
import { useEntityManager } from './useEntityManager';

export const useGroupSelection = () => {
  const entityManager = useEntityManager();
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  const addToSelection = useEditorStore((s) => s.addToSelection);
  const removeFromSelection = useEditorStore((s) => s.removeFromSelection);
  const toggleSelection = useEditorStore((s) => s.toggleSelection);
  const clearSelection = useEditorStore((s) => s.clearSelection);

  // Get all descendants of an entity (recursively)
  const getAllDescendants = useCallback(
    (entityId: number): number[] => {
      const entity = entityManager.getEntity(entityId);
      if (!entity) return [];

      const descendants: number[] = [];

      const collectDescendants = (id: number) => {
        const current = entityManager.getEntity(id);
        if (!current) return;

        current.children.forEach((childId) => {
          descendants.push(childId);
          collectDescendants(childId); // Recursive
        });
      };

      collectDescendants(entityId);
      return descendants;
    },
    [entityManager],
  );

  // Select entity with all its children (Unity-like behavior)
  const selectWithChildren = useCallback(
    (entityId: number) => {
      console.log(`[useGroupSelection] selectWithChildren for entity ${entityId}`);
      const descendants = getAllDescendants(entityId);
      console.log(`[useGroupSelection] Found descendants:`, descendants);
      const allSelected = [entityId, ...descendants];
      console.log(`[useGroupSelection] Setting selectedIds to:`, allSelected);
      setSelectedIds(allSelected);
    },
    [getAllDescendants, setSelectedIds],
  );

  // Select entity alone (for multi-select scenarios)
  const selectSingle = useCallback(
    (entityId: number) => {
      setSelectedIds([entityId]);
    },
    [setSelectedIds],
  );

  // Add entity and its children to selection
  const addGroupToSelection = useCallback(
    (entityId: number) => {
      const descendants = getAllDescendants(entityId);
      const toAdd = [entityId, ...descendants];

      toAdd.forEach((id) => {
        if (!selectedIds.includes(id)) {
          addToSelection(id);
        }
      });
    },
    [getAllDescendants, selectedIds, addToSelection],
  );

  // Remove entity and its children from selection
  const removeGroupFromSelection = useCallback(
    (entityId: number) => {
      const descendants = getAllDescendants(entityId);
      const toRemove = [entityId, ...descendants];

      toRemove.forEach((id) => {
        if (selectedIds.includes(id)) {
          removeFromSelection(id);
        }
      });
    },
    [getAllDescendants, selectedIds, removeFromSelection],
  );

  // Select range of entities in hierarchy order
  const selectRange = useCallback(
    (startEntityId: number, endEntityId: number, allEntityIds: number[]) => {
      const startIndex = allEntityIds.findIndex((id) => id === startEntityId);
      const endIndex = allEntityIds.findIndex((id) => id === endEntityId);

      if (startIndex === -1 || endIndex === -1) {
        console.warn(`[useGroupSelection] Cannot find range entities in hierarchy`);
        return;
      }

      const minIndex = Math.min(startIndex, endIndex);
      const maxIndex = Math.max(startIndex, endIndex);
      const rangeIds = allEntityIds.slice(minIndex, maxIndex + 1);

      console.log(
        `[useGroupSelection] Selecting range: indices ${minIndex}-${maxIndex}, entities:`,
        rangeIds,
      );
      setSelectedIds(rangeIds);
    },
    [setSelectedIds],
  );

  // Handle hierarchy selection with modifiers
  const handleHierarchySelection = useCallback(
    (
      entityId: number,
      options: {
        ctrlKey?: boolean;
        shiftKey?: boolean;
        selectChildren?: boolean;
        allEntityIds?: number[]; // For range selection
      } = {},
    ) => {
      const {
        ctrlKey = false,
        shiftKey = false,
        selectChildren = true,
        allEntityIds = [],
      } = options;

      console.log(
        `[useGroupSelection] handleHierarchySelection: entityId=${entityId}, selectChildren=${selectChildren}, ctrl=${ctrlKey}, shift=${shiftKey}`,
      );
      console.log(`[useGroupSelection] Current selectedIds:`, selectedIds);

      if (ctrlKey) {
        // Ctrl+click: toggle selection
        if (selectChildren) {
          if (selectedIds.includes(entityId)) {
            console.log(`[useGroupSelection] Removing group from selection`);
            removeGroupFromSelection(entityId);
          } else {
            console.log(`[useGroupSelection] Adding group to selection`);
            addGroupToSelection(entityId);
          }
        } else {
          toggleSelection(entityId);
        }
      } else if (shiftKey) {
        // Shift+click: range selection from last selected to current
        if (selectedIds.length > 0 && allEntityIds.length > 0) {
          const lastSelected = selectedIds[selectedIds.length - 1];
          console.log(`[useGroupSelection] Range selection from ${lastSelected} to ${entityId}`);
          selectRange(lastSelected, entityId, allEntityIds);
        } else {
          // No previous selection, treat as normal selection
          if (selectChildren) {
            console.log(`[useGroupSelection] No previous selection, selecting with children`);
            selectWithChildren(entityId);
          } else {
            addToSelection(entityId);
          }
        }
      } else {
        // Normal click: select only this entity (and children if enabled)
        if (selectChildren) {
          console.log(`[useGroupSelection] Selecting entity with children`);
          selectWithChildren(entityId);
        } else {
          console.log(
            `[useGroupSelection] Selecting single entity - this will break group selection`,
          );
          selectSingle(entityId);
        }
      }

      console.log(
        `[useGroupSelection] After selection operation, new selectedIds should be updated`,
      );
    },
    [
      selectedIds,
      selectWithChildren,
      selectSingle,
      addGroupToSelection,
      removeGroupFromSelection,
      toggleSelection,
      addToSelection,
      selectRange,
    ],
  );

  // Check if entity is selected (either directly or as part of group)
  const isSelected = useCallback(
    (entityId: number) => {
      return selectedIds.includes(entityId);
    },
    [selectedIds],
  );

  // Check if entity is primary selection (first in selection)
  const isPrimarySelection = useCallback(
    (entityId: number) => {
      return selectedIds.length > 0 && selectedIds[0] === entityId;
    },
    [selectedIds],
  );

  // Get selection info for display
  const getSelectionInfo = useCallback(() => {
    if (selectedIds.length === 0) {
      return { count: 0, primary: null, hasMultiple: false };
    }

    return {
      count: selectedIds.length,
      primary: selectedIds[0],
      hasMultiple: selectedIds.length > 1,
      ids: selectedIds,
    };
  }, [selectedIds]);

  return {
    selectedIds,
    selectWithChildren,
    selectSingle,
    addGroupToSelection,
    removeGroupFromSelection,
    selectRange,
    handleHierarchySelection,
    isSelected,
    isPrimarySelection,
    getSelectionInfo,
    getAllDescendants,
    clearSelection,
  };
};
