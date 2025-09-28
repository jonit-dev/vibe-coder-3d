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

  const selectWithChildren = useCallback(
    (entityId: number) => {
      const descendants = getAllDescendants(entityId);
      const allSelected = [entityId, ...descendants];
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
        return;
      }

      const minIndex = Math.min(startIndex, endIndex);
      const maxIndex = Math.max(startIndex, endIndex);
      const rangeIds = allEntityIds.slice(minIndex, maxIndex + 1);
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

      if (ctrlKey) {
        // Ctrl+click: toggle selection
        if (selectChildren) {
          if (selectedIds.includes(entityId)) {
            removeGroupFromSelection(entityId);
          } else {
            addGroupToSelection(entityId);
          }
        } else {
          toggleSelection(entityId);
        }
      } else if (shiftKey) {
        // Shift+click: range selection from last selected to current
        if (selectedIds.length > 0 && allEntityIds.length > 0) {
          const lastSelected = selectedIds[selectedIds.length - 1];
          selectRange(lastSelected, entityId, allEntityIds);
        } else {
          if (selectChildren) {
            selectWithChildren(entityId);
          } else {
            addToSelection(entityId);
          }
        }
      } else {
        if (selectChildren) {
          selectWithChildren(entityId);
        } else {
          selectSingle(entityId);
        }
      }
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
